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
    
    // Supabase Edge Function endpoint
    private static final String API_ENDPOINT = "https://mofwljpreecqqxkilywh.supabase.co/functions/v1/sms-transaction-handler";
    private static final String ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZndsanByZWVjcXF4a2lseXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTk5MDgsImV4cCI6MjA3MjY5NTkwOH0.1kfabhKCzV9P384_J9uWF6wGSRHDTYr_9yUBTvGDAvY";

    // Transaction patterns for Bangladesh payment gateways
    private static final Pattern BKASH_PATTERN = Pattern.compile(
        "bKash.*?(?:TrxID|Transaction ID):?\\s*([A-Z0-9]+).*?(?:Amount|Tk):?\\s*([0-9,.]+)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern NAGAD_PATTERN = Pattern.compile(
        "Nagad.*?(?:TxnId|Transaction):?\\s*([A-Z0-9]+).*?(?:Amount|Tk):?\\s*([0-9,.]+)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
    );
    
    private static final Pattern ROCKET_PATTERN = Pattern.compile(
        "Rocket.*?(?:TxID|Reference):?\\s*([A-Z0-9]+).*?(?:Amount|Tk):?\\s*([0-9,.]+)",
        Pattern.CASE_INSENSITIVE | Pattern.DOTALL
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
        TransactionData transaction = extractTransactionData(message);
        
        if (transaction != null) {
            Log.d(TAG, "Transaction detected: " + transaction.transactionId);
            
            // Send to server in background
            new Thread(() -> {
                try {
                    sendTransactionToServer(context, transaction, sender, message);
                } catch (Exception e) {
                    Log.e(TAG, "Failed to send transaction to server", e);
                }
            }).start();
        }
    }

    private TransactionData extractTransactionData(String message) {
        // Try bKash pattern
        Matcher matcher = BKASH_PATTERN.matcher(message);
        if (matcher.find()) {
            return new TransactionData(
                matcher.group(1),
                "bkash",
                matcher.group(2).replace(",", "")
            );
        }
        
        // Try Nagad pattern
        matcher = NAGAD_PATTERN.matcher(message);
        if (matcher.find()) {
            return new TransactionData(
                matcher.group(1),
                "nagad",
                matcher.group(2).replace(",", "")
            );
        }
        
        // Try Rocket pattern
        matcher = ROCKET_PATTERN.matcher(message);
        if (matcher.find()) {
            return new TransactionData(
                matcher.group(1),
                "rocket",
                matcher.group(2).replace(",", "")
            );
        }
        
        return null;
    }

    private void sendTransactionToServer(Context context, TransactionData transaction, String sender, String message) {
        try {
            java.net.URL url = new java.net.URL(API_ENDPOINT);
            javax.net.ssl.HttpsURLConnection conn = (javax.net.ssl.HttpsURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", ANON_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + ANON_KEY);
            conn.setDoOutput(true);
            
            // Build JSON payload
            String jsonPayload = String.format(
                "{\"smsData\":{\"transaction_id\":\"%s\",\"sender_number\":\"%s\",\"message_content\":\"%s\",\"wallet_type\":\"%s\",\"amount\":%s,\"timestamp\":%d}}",
                transaction.transactionId,
                sender.replace("\"", "\\\""),
                message.replace("\"", "\\\"").replace("\n", "\\n"),
                transaction.gateway,
                transaction.amount,
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
                showNotification(context, "Transaction Sent", 
                    "Transaction ID: " + transaction.transactionId + " sent to server");
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

    private static class TransactionData {
        String transactionId;
        String gateway;
        String amount;
        
        TransactionData(String transactionId, String gateway, String amount) {
            this.transactionId = transactionId;
            this.gateway = gateway;
            this.amount = amount;
        }
    }
}
