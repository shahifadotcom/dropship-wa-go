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
    
    // Direct Supabase endpoint
    private static final String SUPABASE_ENDPOINT = "https://mofwljpreecqqxkilywh.supabase.co/functions/v1/sms-transaction-local";
    private static final String ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZndsanByZWVjcXF4a2lseXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTk5MDgsImV4cCI6MjA3MjY5NTkwOH0.1kfabhKCzV9P384_J9uWF6wGSRHDTYr_9yUBTvGDAvY";

    // Pattern to extract transaction ID (TrxID CI131K7A2D)
    private static final Pattern TRXID_PATTERN = Pattern.compile(
        "TrxID\\s+([A-Z0-9]{8,15})",
        Pattern.CASE_INSENSITIVE
    );
    
    // Alternative pattern for Ref numbers (Ref 95352)
    private static final Pattern REF_PATTERN = Pattern.compile(
        "Ref\\s+([A-Z0-9]{5,15})",
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
            Log.d(TAG, "Not a wallet SMS, ignoring");
            return;
        }

        String transactionId = extractTransactionId(message);
        
        if (transactionId != null) {
            Log.d(TAG, "✓ Transaction ID detected: " + transactionId);
            
            // Send to Supabase in background
            new Thread(() -> {
                try {
                    sendToSupabase(context, transactionId, sender, message);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to send transaction", e);
                }
            }).start();
        } else {
            Log.w(TAG, "✗ No transaction ID found in SMS");
        }
    }

    private boolean isWalletSMS(String sender, String message) {
        // Common wallet sender patterns
        String[] walletSenders = {"bKash", "Nagad", "Rocket", "DBBL", "Dutch-Bangla"};
        for (String walletSender : walletSenders) {
            if (sender.toLowerCase().contains(walletSender.toLowerCase())) {
                Log.d(TAG, "Wallet SMS from: " + walletSender);
                return true;
            }
        }
        
        // Check message content for wallet keywords
        String lowerMessage = message.toLowerCase();
        return lowerMessage.contains("received") || 
               lowerMessage.contains("trxid") || 
               lowerMessage.contains("ref ") ||
               lowerMessage.contains("balance");
    }

    private String extractTransactionId(String message) {
        // Try TrxID pattern first
        Matcher trxMatcher = TRXID_PATTERN.matcher(message);
        if (trxMatcher.find()) {
            String trxId = trxMatcher.group(1).trim();
            Log.d(TAG, "✓ Found TrxID: " + trxId);
            return trxId;
        }
        
        // Try Ref pattern
        Matcher refMatcher = REF_PATTERN.matcher(message);
        if (refMatcher.find()) {
            String refId = refMatcher.group(1).trim();
            Log.d(TAG, "✓ Found Ref: " + refId);
            return refId;
        }
        
        return null;
    }

    private void sendToSupabase(Context context, String transactionId, String sender, String message) {
        try {
            java.net.URL url = new java.net.URL(SUPABASE_ENDPOINT);
            javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", ANON_KEY);
            conn.setDoOutput(true);
            conn.setConnectTimeout(10000);
            conn.setReadTimeout(10000);
            
            String jsonPayload = String.format(
                "{\"smsData\":{\"transaction_id\":\"%s\",\"sender_number\":\"%s\",\"message_content\":\"%s\",\"timestamp\":%d}}",
                transactionId,
                sender.replace("\"", "\\\""),
                message.replace("\"", "\\\"").replace("\n", "\\n"),
                System.currentTimeMillis()
            );
            
            Log.d(TAG, "→ Sending to Supabase");
            
            java.io.OutputStream os = conn.getOutputStream();
            os.write(jsonPayload.getBytes("UTF-8"));
            os.close();
            
            int responseCode = conn.getResponseCode();
            Log.d(TAG, "← Response code: " + responseCode);
            
            if (responseCode == 200) {
                Log.d(TAG, "✓ Transaction sent successfully");
                showNotification(context, "Transaction Detected", 
                    "ID: " + transactionId + " sent to Supabase");
            } else {
                Log.e(TAG, "✗ Error: Response code " + responseCode);
                showNotification(context, "Error", "Failed to send transaction");
            }
            
            conn.disconnect();
            
        } catch (Exception e) {
            Log.e(TAG, "✗ Error: " + e.getMessage(), e);
            showNotification(context, "Error", "Failed: " + e.getMessage());
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
}
