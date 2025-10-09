package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;

public class IncomingCallActivity extends AppCompatActivity {
    private String callerId;
    private String callType;
    private String callId;
    private String offer;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Show activity even when screen is locked
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        
        setContentView(R.layout.activity_incoming_call);
        
        // Get call data from intent
        Intent intent = getIntent();
        callerId = intent.getStringExtra("callerId");
        callType = intent.getStringExtra("callType");
        callId = intent.getStringExtra("callId");
        offer = intent.getStringExtra("offer");
        
        // Set up UI
        TextView callerInfo = findViewById(R.id.caller_info);
        callerInfo.setText("Incoming " + callType + " call from " + callerId);
        
        Button answerButton = findViewById(R.id.answer_button);
        Button declineButton = findViewById(R.id.decline_button);
        
        answerButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                answerCall();
            }
        });
        
        declineButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                declineCall();
            }
        });
    }

    private void answerCall() {
        // Open the web app's calling page to handle the call
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("navigateTo", "/calling");
        intent.putExtra("callId", callId);
        intent.putExtra("callerId", callerId);
        intent.putExtra("callType", callType);
        intent.putExtra("offer", offer);
        intent.putExtra("action", "answer");
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        startActivity(intent);
        finish();
    }

    private void declineCall() {
        // TODO: Send decline signal through socket
        finish();
    }
}
