import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Phone, Video, PhoneOff, Mic, MicOff, VideoOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import io from 'socket.io-client';

const CALLING_SERVER_URL = 'http://localhost:3003';

export default function Calling() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [socket, setSocket] = useState<any>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [inCall, setInCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const currentCallId = useRef<string | null>(null);
  const targetUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    checkSubscription();
    initializeSocket();

    return () => {
      if (socket) {
        socket.disconnect();
      }
      cleanupCall();
    };
  }, [user]);

  const checkSubscription = async () => {
    if (!user) return;

    const { data: subscription } = await supabase
      .from('calling_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!subscription) {
      toast({
        title: 'Subscription Required',
        description: 'You need an active subscription to make calls',
        variant: 'destructive'
      });
      navigate('/');
      return;
    }

    setHasSubscription(true);
  };

  const initializeSocket = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !user) return;

    const newSocket = io(CALLING_SERVER_URL);

    newSocket.on('connect', () => {
      console.log('Connected to signaling server');
      newSocket.emit('register', {
        userId: user.id,
        accessToken: session.access_token
      });
    });

    newSocket.on('registered', () => {
      console.log('Successfully registered with server');
    });

    newSocket.on('incoming-call', handleIncomingCall);
    newSocket.on('call-answered', handleCallAnswered);
    newSocket.on('call-declined', handleCallDeclined);
    newSocket.on('call-ended', handleCallEnded);
    newSocket.on('ice-candidate', handleIceCandidate);
    newSocket.on('error', handleSocketError);

    setSocket(newSocket);
  };

  const handleIncomingCall = async (data: any) => {
    setIncomingCall(data);
    toast({
      title: 'Incoming Call',
      description: `You have an incoming ${data.callType} call`,
    });
  };

  const handleCallAnswered = async (data: any) => {
    const { answer } = data;
    await peerConnection.current?.setRemoteDescription(
      new RTCSessionDescription(answer)
    );
  };

  const handleCallDeclined = () => {
    toast({
      title: 'Call Declined',
      description: 'The user declined your call',
      variant: 'destructive'
    });
    cleanupCall();
  };

  const handleCallEnded = () => {
    toast({
      title: 'Call Ended',
      description: 'The call has been ended'
    });
    cleanupCall();
  };

  const handleIceCandidate = async (data: any) => {
    const { candidate } = data;
    await peerConnection.current?.addIceCandidate(
      new RTCIceCandidate(candidate)
    );
  };

  const handleSocketError = (error: any) => {
    console.error('Socket error:', error);
    toast({
      title: 'Error',
      description: error.message,
      variant: 'destructive'
    });

    if (error.code === 'NO_SUBSCRIPTION') {
      navigate('/');
    }
  };

  const initializePeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };

    peerConnection.current = new RTCPeerConnection(configuration);

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserId.current) {
        socket.emit('ice-candidate', {
          targetUserId: targetUserId.current,
          candidate: event.candidate
        });
      }
    };

    peerConnection.current.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!targetPhone || !socket || !user) return;

    // Find user by phone number
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('phone', targetPhone)
      .single();

    if (!profile) {
      toast({
        title: 'User Not Found',
        description: 'No user found with this phone number',
        variant: 'destructive'
      });
      return;
    }

    targetUserId.current = profile.id;

    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);

      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = localStream.current;
      }

      initializePeerConnection();

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      const offer = await peerConnection.current!.createOffer();
      await peerConnection.current!.setLocalDescription(offer);

      const { data: { session } } = await supabase.auth.getSession();

      socket.emit('call-user', {
        targetUserId: profile.id,
        offer,
        callType: type,
        accessToken: session?.access_token
      });

      setCallType(type);
      setInCall(true);
    } catch (error) {
      console.error('Error starting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to start call. Please check permissions.',
        variant: 'destructive'
      });
    }
  };

  const answerCall = async () => {
    if (!incomingCall || !socket) return;

    try {
      const constraints = {
        audio: true,
        video: incomingCall.callType === 'video'
      };

      localStream.current = await navigator.mediaDevices.getUserMedia(constraints);

      if (localVideoRef.current && incomingCall.callType === 'video') {
        localVideoRef.current.srcObject = localStream.current;
      }

      initializePeerConnection();

      localStream.current.getTracks().forEach(track => {
        peerConnection.current?.addTrack(track, localStream.current!);
      });

      await peerConnection.current!.setRemoteDescription(
        new RTCSessionDescription(incomingCall.offer)
      );

      const answer = await peerConnection.current!.createAnswer();
      await peerConnection.current!.setLocalDescription(answer);

      socket.emit('answer-call', {
        callId: incomingCall.callId,
        answer,
        callerId: incomingCall.callerId
      });

      currentCallId.current = incomingCall.callId;
      targetUserId.current = incomingCall.callerId;
      setCallType(incomingCall.callType);
      setInCall(true);
      setIncomingCall(null);
    } catch (error) {
      console.error('Error answering call:', error);
      toast({
        title: 'Error',
        description: 'Failed to answer call',
        variant: 'destructive'
      });
    }
  };

  const declineCall = () => {
    if (!incomingCall || !socket) return;

    socket.emit('decline-call', {
      callId: incomingCall.callId,
      callerId: incomingCall.callerId
    });

    setIncomingCall(null);
  };

  const endCall = () => {
    if (socket && currentCallId.current && targetUserId.current) {
      socket.emit('end-call', {
        callId: currentCallId.current,
        targetUserId: targetUserId.current
      });
    }

    cleanupCall();
  };

  const cleanupCall = () => {
    localStream.current?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    
    localStream.current = null;
    peerConnection.current = null;
    currentCallId.current = null;
    targetUserId.current = null;

    setInCall(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream.current) {
      const videoTrack = localStream.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Audio/Video Calling</h1>
          <p className="text-muted-foreground mb-6">
            Please login or register to use calling features
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/auth')} 
              className="w-full"
              size="lg"
            >
              Login / Register
            </Button>
            <Button 
              onClick={() => navigate('/')} 
              variant="outline"
              className="w-full"
            >
              Back to Store
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!hasSubscription) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-md w-full bg-card border rounded-lg p-8 text-center">
          <Phone className="h-16 w-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold mb-2">Subscription Required</h1>
          <p className="text-muted-foreground mb-6">
            You need an active calling subscription to use this feature
          </p>
          <Button 
            onClick={() => navigate('/')} 
            className="w-full"
            size="lg"
          >
            Back to Store
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Audio/Video Calling</h1>

        {incomingCall && (
          <div className="bg-card border rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Incoming {incomingCall.callType} call</h2>
            <div className="flex gap-4">
              <Button onClick={answerCall} className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Answer
              </Button>
              <Button onClick={declineCall} variant="destructive" className="flex-1">
                <PhoneOff className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          </div>
        )}

        {!inCall ? (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Start a Call</h2>
            <div className="space-y-4">
              <Input
                type="tel"
                placeholder="Enter phone number"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
              />
              <div className="flex gap-4">
                <Button
                  onClick={() => startCall('audio')}
                  className="flex-1"
                  disabled={!targetPhone}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Audio Call
                </Button>
                <Button
                  onClick={() => startCall('video')}
                  className="flex-1"
                  disabled={!targetPhone}
                >
                  <Video className="mr-2 h-4 w-4" />
                  Video Call
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">In Call ({callType})</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {callType === 'video' && (
                <>
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm">You</div>
                  </div>
                  <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 text-white text-sm">Remote</div>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-center gap-4">
              <Button onClick={toggleMute} variant="outline" size="lg">
                {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
              </Button>
              {callType === 'video' && (
                <Button onClick={toggleVideo} variant="outline" size="lg">
                  {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                </Button>
              )}
              <Button onClick={endCall} variant="destructive" size="lg">
                <PhoneOff className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
