package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.util.Log;
import androidx.core.app.NotificationCompat;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import io.socket.client.IO;
import io.socket.client.Socket;
import io.socket.emitter.Emitter;
import org.json.JSONObject;
import org.webrtc.*;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

public class CallingService extends Service {
    private static final String TAG = "CallingService";
    private static final String CHANNEL_ID = "calling_service";
    private static final int NOTIFICATION_ID = 2001;
    
    private Socket socket;
    private PeerConnectionFactory peerConnectionFactory;
    private PeerConnection peerConnection;
    private String userId;
    private String accessToken;
    private boolean isInCall = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        initializeWebRTC();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            userId = intent.getStringExtra("userId");
            accessToken = intent.getStringExtra("accessToken");
            
            startForeground(NOTIFICATION_ID, createNotification("Calling service running"));
            connectToSignalingServer();
        }
        
        return START_STICKY;
    }

    private void initializeWebRTC() {
        PeerConnectionFactory.InitializationOptions initOptions = 
            PeerConnectionFactory.InitializationOptions.builder(this)
                .setEnableInternalTracer(true)
                .createInitializationOptions();
        
        PeerConnectionFactory.initialize(initOptions);
        
        PeerConnectionFactory.Options options = new PeerConnectionFactory.Options();
        peerConnectionFactory = PeerConnectionFactory.builder()
            .setOptions(options)
            .createPeerConnectionFactory();
    }

    private void connectToSignalingServer() {
        try {
            socket = IO.socket("http://localhost:3001");
            
            socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    Log.d(TAG, "Connected to signaling server");
                    registerWithServer();
                }
            });
            
            socket.on("incoming-call", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleIncomingCall((JSONObject) args[0]);
                }
            });
            
            socket.on("call-answered", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleCallAnswered((JSONObject) args[0]);
                }
            });
            
            socket.on("call-ended", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleCallEnded();
                }
            });
            
            socket.on("ice-candidate", new Emitter.Listener() {
                @Override
                public void call(Object... args) {
                    handleIceCandidate((JSONObject) args[0]);
                }
            });
            
            socket.connect();
            
        } catch (URISyntaxException e) {
            Log.e(TAG, "Socket connection error", e);
        }
    }

    private void registerWithServer() {
        try {
            JSONObject data = new JSONObject();
            data.put("userId", userId);
            data.put("accessToken", accessToken);
            socket.emit("register", data);
            Log.d(TAG, "Registered with server");
        } catch (Exception e) {
            Log.e(TAG, "Registration error", e);
        }
    }

    private void handleIncomingCall(JSONObject data) {
        try {
            String callerId = data.getString("callerId");
            String callType = data.getString("callType");
            String callId = data.getString("callId");
            
            // Show incoming call activity
            Intent intent = new Intent(this, IncomingCallActivity.class);
            intent.putExtra("callerId", callerId);
            intent.putExtra("callType", callType);
            intent.putExtra("callId", callId);
            intent.putExtra("offer", data.getJSONObject("offer").toString());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            startActivity(intent);
            
            // Update notification
            updateNotification("Incoming " + callType + " call");
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling incoming call", e);
        }
    }

    private void handleCallAnswered(JSONObject data) {
        try {
            JSONObject answer = data.getJSONObject("answer");
            SessionDescription sessionDescription = new SessionDescription(
                SessionDescription.Type.ANSWER,
                answer.getString("sdp")
            );
            
            if (peerConnection != null) {
                peerConnection.setRemoteDescription(new SimpleSdpObserver(), sessionDescription);
            }
            
            isInCall = true;
            updateNotification("Call in progress");
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling call answered", e);
        }
    }

    private void handleCallEnded() {
        isInCall = false;
        cleanupCall();
        updateNotification("Calling service running");
    }

    private void handleIceCandidate(JSONObject data) {
        try {
            JSONObject candidateJson = data.getJSONObject("candidate");
            IceCandidate candidate = new IceCandidate(
                candidateJson.getString("sdpMid"),
                candidateJson.getInt("sdpMLineIndex"),
                candidateJson.getString("candidate")
            );
            
            if (peerConnection != null) {
                peerConnection.addIceCandidate(candidate);
            }
            
        } catch (Exception e) {
            Log.e(TAG, "Error handling ICE candidate", e);
        }
    }

    private void cleanupCall() {
        if (peerConnection != null) {
            peerConnection.close();
            peerConnection = null;
        }
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Calling Service",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Handles incoming audio/video calls");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            manager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification(String text) {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Shahifa Calling")
            .setContentText(text)
            .setSmallIcon(android.R.drawable.ic_menu_call)
            .setContentIntent(pendingIntent)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setOngoing(true)
            .build();
    }

    private void updateNotification(String text) {
        NotificationManager manager = (NotificationManager) getSystemService(NOTIFICATION_SERVICE);
        manager.notify(NOTIFICATION_ID, createNotification(text));
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        if (socket != null) {
            socket.disconnect();
            socket = null;
        }
        cleanupCall();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    // Simple SDP Observer
    private static class SimpleSdpObserver implements SdpObserver {
        @Override
        public void onCreateSuccess(SessionDescription sessionDescription) {}

        @Override
        public void onSetSuccess() {}

        @Override
        public void onCreateFailure(String s) {
            Log.e(TAG, "SDP creation failed: " + s);
        }

        @Override
        public void onSetFailure(String s) {
            Log.e(TAG, "SDP set failed: " + s);
        }
    }
}
