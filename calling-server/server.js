require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://mofwljpreecqqxkilywh.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZndsanByZWVjcXF4a2lseXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTk5MDgsImV4cCI6MjA3MjY5NTkwOH0.1kfabhKCzV9P384_J9uWF6wGSRHDTYr_9yUBTvGDAvY'
);

// Store active users and their socket connections
const activeUsers = new Map();
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // User registration
  socket.on('register', async (data) => {
    const { userId, accessToken } = data;
    
    if (!userId || !accessToken) {
      socket.emit('error', { message: 'Invalid registration data' });
      return;
    }

    // Verify user with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user || user.id !== userId) {
      socket.emit('error', { message: 'Authentication failed' });
      return;
    }

    activeUsers.set(userId, socket.id);
    onlineUsers.set(socket.id, userId);
    socket.userId = userId;

    // Notify user of successful registration
    socket.emit('registered', { userId });

    // Broadcast online status
    io.emit('user-status', { userId, status: 'online' });

    console.log(`User ${userId} registered with socket ${socket.id}`);
  });

  // Check subscription status
  socket.on('check-subscription', async (data) => {
    const { userId, accessToken } = data;

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      socket.emit('subscription-status', { hasSubscription: false });
      return;
    }

    // Check active subscription
    const { data: subscription } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    socket.emit('subscription-status', { 
      hasSubscription: !!subscription,
      subscription 
    });
  });

  // Initiate call
  socket.on('call-user', async (data) => {
    const { targetUserId, offer, callType, accessToken } = data;
    const callerUserId = socket.userId;

    if (!callerUserId) {
      socket.emit('error', { message: 'Not registered' });
      return;
    }

    // Check caller subscription
    const { data: subscription } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .eq('user_id', callerUserId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!subscription) {
      socket.emit('error', { 
        message: 'Subscription required to make calls',
        code: 'NO_SUBSCRIPTION'
      });
      return;
    }

    // Create call log
    const { data: callLog, error: logError } = await supabase
      .from('call_logs')
      .insert({
        caller_id: callerUserId,
        receiver_id: targetUserId,
        call_type: callType,
        status: 'initiated'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating call log:', logError);
      socket.emit('error', { message: 'Failed to initiate call' });
      return;
    }

    const targetSocketId = activeUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('incoming-call', {
        callId: callLog.id,
        callerId: callerUserId,
        offer,
        callType
      });

      // Update call status to ringing
      await supabase
        .from('call_logs')
        .update({ status: 'ringing' })
        .eq('id', callLog.id);
    } else {
      socket.emit('user-offline', { targetUserId });
      
      // Update call status to missed
      await supabase
        .from('call_logs')
        .update({ status: 'missed' })
        .eq('id', callLog.id);
    }
  });

  // Answer call
  socket.on('answer-call', async (data) => {
    const { callId, answer, callerId } = data;

    // Update call status
    await supabase
      .from('call_logs')
      .update({ 
        status: 'answered',
        started_at: new Date().toISOString()
      })
      .eq('id', callId);

    const callerSocketId = activeUsers.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-answered', {
        callId,
        answer
      });
    }
  });

  // Decline call
  socket.on('decline-call', async (data) => {
    const { callId, callerId } = data;

    // Update call status
    await supabase
      .from('call_logs')
      .update({ 
        status: 'declined',
        ended_at: new Date().toISOString()
      })
      .eq('id', callId);

    const callerSocketId = activeUsers.get(callerId);
    
    if (callerSocketId) {
      io.to(callerSocketId).emit('call-declined', { callId });
    }
  });

  // End call
  socket.on('end-call', async (data) => {
    const { callId, targetUserId } = data;

    // Calculate duration and update call log
    const { data: callLog } = await supabase
      .from('call_logs')
      .select('started_at')
      .eq('id', callId)
      .single();

    if (callLog?.started_at) {
      const duration = Math.floor(
        (new Date() - new Date(callLog.started_at)) / 1000
      );

      await supabase
        .from('call_logs')
        .update({ 
          status: 'ended',
          ended_at: new Date().toISOString(),
          duration_seconds: duration
        })
        .eq('id', callId);
    }

    const targetSocketId = activeUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('call-ended', { callId });
    }
  });

  // ICE candidate exchange
  socket.on('ice-candidate', (data) => {
    const { targetUserId, candidate } = data;
    const targetSocketId = activeUsers.get(targetUserId);
    
    if (targetSocketId) {
      io.to(targetSocketId).emit('ice-candidate', {
        candidate,
        senderId: socket.userId
      });
    }
  });

  // Get online users
  socket.on('get-online-users', () => {
    const users = Array.from(activeUsers.keys());
    socket.emit('online-users', { users });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const userId = onlineUsers.get(socket.id);
    
    if (userId) {
      activeUsers.delete(userId);
      onlineUsers.delete(socket.id);
      
      // Broadcast offline status
      io.emit('user-status', { userId, status: 'offline' });
      
      console.log(`User ${userId} disconnected`);
    }
  });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`WebRTC signaling server running on port ${PORT}`);
  console.log(`Server is accessible at http://0.0.0.0:${PORT}`);
});
