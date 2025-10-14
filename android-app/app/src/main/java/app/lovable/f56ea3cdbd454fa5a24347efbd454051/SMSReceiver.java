package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SMSReceiver extends BroadcastReceiver {
    private static final String TAG = "SMSReceiver";
    
    // Main server endpoint (local server IP)
    private static final String API_ENDPOINT = "http://161.97.169.64:3000/api/sms-transaction";
    private static final String ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZndsanByZWVjcXF4a2lseXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTk5MDgsImV4cCI6MjA3MjY5NTkwOH0.1kfabhKCzV9P384_J9uWF6wGSRHDTYr_9yUBTvGDAvY";

    // Enhanced pattern to extract transaction ID from bKash, Nagad, Rocket SMS
    // Matches patterns like: "TrxID CI131K7A2D", "Transaction ID: ABC123XYZ", "Trx ID BK12345ABC"
    private static final Pattern TRANSACTION_PATTERN = Pattern.compile(
        "(?:TrxID|Trx\\s*ID|Transaction\\s*ID|Trans\\s*ID)[:\\s]+([A-Z0-9]{8,15})",
        Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onReceive(Context context, Intent intent) {
        Log.d(TAG, "SMS received");
        
        Bundle bundle = intent.getExtras();
        if (bundle != null) {
            try {
                Object[] pdus = (Object[]) bundle.get("pdus");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                        String sender = smsMessage.getDisplayOriginatingAddress();
                        String messageBody = smsMessage.getMessageBody();
                        
                        Log.d(TAG, "SMS from: " + sender);
                        Log.d(TAG, "Message: " + messageBody);
                        
                        // Process the SMS to extract transaction data
                        processTransactionSMS(context, sender, messageBody);
                    }
                }
            } catch (Exception e) {
                Log.e(TAG, "Error processing SMS", e);
            }
        }
    }

    private void processTransactionSMS(Context context, String sender, String message) {
        // Check if this is a wallet SMS
        if (!isWalletSMS(sender, message)) {
            return;
        }

        String transactionId = extractTransactionId(message);
        
        if (transactionId != null) {
            Log.d(TAG, "Transaction ID detected: " + transactionId);
            
            // Send to server in background
            new Thread(() -> {
                try {
                    sendTransactionToServer(context, transactionId, sender, message);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to send transaction to server", e);
                }
            }).start();
        }
    }

    private boolean isWalletSMS(String sender, String message) {
        // Common wallet sender patterns
        String[] walletSenders = {"bKash", "Nagad", "Rocket", "DBBL", "Dutch-Bangla"};
        for (String walletSender : walletSenders) {
            if (sender.toLowerCase().contains(walletSender.toLowerCase())) {
                return true;
            }
        }
        
        // Check message content for wallet keywords
        String lowerMessage = message.toLowerCase();
        return lowerMessage.contains("transaction") || 
               lowerMessage.contains("trxid") || 
               lowerMessage.contains("successful");
    }

    private String extractTransactionId(String message) {
        Matcher matcher = TRANSACTION_PATTERN.matcher(message);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private void sendTransactionToServer(Context context, String transactionId, String sender, String message) {
        try {
            // Get stored auth token
            String authToken = getStoredAuthToken(context);
            if (authToken == null) {
                Log.e(TAG, "No auth token found - user must log in first");
                showNotification(context, "Authentication Required", "Please log in to the app");
                return;
            }

            java.net.URL url = new java.net.URL(API_ENDPOINT);
            javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", ANON_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + authToken);
            conn.setDoOutput(true);
            
            // Build simplified JSON payload (transaction ID only)
            String jsonPayload = String.format(
                "{\"smsData\":{\"transaction_id\":\"%s\",\"sender_number\":\"%s\",\"message_content\":\"%s\",\"timestamp\":%d}}",
                transactionId,
                sender.replace("\"", "\\\""),
                message.replace("\"", "\\\"").replace("\n", "\\n"),
                System.currentTimeMillis()
            );
            
            Log.d(TAG, "Sending payload: " + jsonPayload);
            
            java.io.OutputStream os = conn.getOutputStream();
            os.write(jsonPayload.getBytes("UTF-8"));
            os.close();
            
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Server response code: " + responseCode);
            
            if (responseCode == 200) {
                java.io.BufferedReader br = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getInputStream())
                );
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                br.close();
                
                Log.d(TAG, "Server response: " + response.toString());
                
                // Show notification to user
                showNotification(context, "Transaction Detected", 
                    "Transaction ID: " + transactionId + " sent to server");
            } else {
                Log.e(TAG, "Server returned error code: " + responseCode);
            }
            
            conn.disconnect();
            
        } catch (Exception e) {
            Log.e(TAG, "Network error sending transaction", e);
        }
    }

    private void showNotification(Context context, String title, String message) {
        try {
            android.app.NotificationManager notificationManager = 
                (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            
            String channelId = "transaction_channel";
            
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    channelId,
                    "Transaction Notifications",
                    android.app.NotificationManager.IMPORTANCE_DEFAULT
                );
                notificationManager.createNotificationChannel(channel);
            }
            
            android.app.Notification notification = new android.app.Notification.Builder(context, channelId)
                .setContentTitle(title)
                .setContentText(message)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setAutoCancel(true)
                .build();
            
            notificationManager.notify((int) System.currentTimeMillis(), notification);
        } catch (Exception e) {
            Log.e(TAG, "Failed to show notification", e);
        }
    }

    // Helper method to retrieve stored auth token
    private String getStoredAuthToken(Context context) {
        return AuthTokenManager.getAccessToken(context);
    }
}
