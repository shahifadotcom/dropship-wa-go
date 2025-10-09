package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.Manifest;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import android.util.Log;
import android.view.Menu;
import android.view.MenuItem;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";
    private static final int SMS_PERMISSION_REQUEST_CODE = 100;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        Log.d(TAG, "MainActivity created");
        
        // Check if user is authenticated
        if (!AuthTokenManager.isAuthenticated(this)) {
            Log.w(TAG, "User not authenticated - redirecting to login");
            redirectToLogin();
            return;
        }
        
        // Add JavaScript interface for auth token management
        getBridge().getWebView().addJavascriptInterface(
            new AuthTokenManager(this), 
            "Android"
        );
        
        // Request SMS permissions on startup
        requestSMSPermissions();
        
        // Start SMS monitoring service
        startSMSMonitorService();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        menu.add(0, 1, 0, "Logout");
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        if (item.getItemId() == 1) {
            logout();
            return true;
        }
        return super.onOptionsItemSelected(item);
    }

    private void logout() {
        Log.d(TAG, "Logging out");
        AuthTokenManager tokenManager = new AuthTokenManager(this);
        tokenManager.clearAuthToken();
        redirectToLogin();
    }

    private void redirectToLogin() {
        Intent intent = new Intent(this, LoginActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }

    private void requestSMSPermissions() {
        String[] permissions = {
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.POST_NOTIFICATIONS
        };

        boolean allGranted = true;
        for (String permission : permissions) {
            if (ContextCompat.checkSelfPermission(this, permission) 
                    != PackageManager.PERMISSION_GRANTED) {
                allGranted = false;
                break;
            }
        }

        if (!allGranted) {
            ActivityCompat.requestPermissions(this, permissions, SMS_PERMISSION_REQUEST_CODE);
        } else {
            Log.d(TAG, "All SMS permissions already granted");
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        
        if (requestCode == SMS_PERMISSION_REQUEST_CODE) {
            boolean allGranted = true;
            for (int result : grantResults) {
                if (result != PackageManager.PERMISSION_GRANTED) {
                    allGranted = false;
                    break;
                }
            }
            
            if (allGranted) {
                Log.d(TAG, "SMS permissions granted");
                startSMSMonitorService();
            } else {
                Log.w(TAG, "SMS permissions denied");
            }
        }
    }

    private void startSMSMonitorService() {
        try {
            Intent serviceIntent = new Intent(this, SMSMonitorService.class);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
                startForegroundService(serviceIntent);
            } else {
                startService(serviceIntent);
            }
            Log.d(TAG, "SMS Monitor Service started");
        } catch (Exception e) {
            Log.e(TAG, "Failed to start SMS Monitor Service", e);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "MainActivity destroyed");
    }
}
