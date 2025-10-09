package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.app.Activity;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import com.google.android.material.textfield.TextInputEditText;
import org.json.JSONObject;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;

public class LoginActivity extends Activity {
    private static final String TAG = "LoginActivity";
    private static final String SUPABASE_URL = "https://mofwljpreecqqxkilywh.supabase.co";
    private static final String SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1vZndsanByZWVjcXF4a2lseXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxMTk5MDgsImV4cCI6MjA3MjY5NTkwOH0.1kfabhKCzV9P384_J9uWF6wGSRHDTYr_9yUBTvGDAvY";

    private TextInputEditText emailInput;
    private TextInputEditText passwordInput;
    private Button loginButton;
    private TextView errorText;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        emailInput = findViewById(R.id.emailInput);
        passwordInput = findViewById(R.id.passwordInput);
        loginButton = findViewById(R.id.loginButton);
        errorText = findViewById(R.id.errorText);
        progressBar = findViewById(R.id.progressBar);

        // Check if already logged in
        if (AuthTokenManager.isAuthenticated(this)) {
            navigateToMainActivity();
            return;
        }

        loginButton.setOnClickListener(v -> attemptLogin());
    }

    private void attemptLogin() {
        String email = emailInput.getText().toString().trim();
        String password = passwordInput.getText().toString().trim();

        if (email.isEmpty() || password.isEmpty()) {
            showError("Please enter email and password");
            return;
        }

        setLoading(true);
        
        new Thread(() -> {
            try {
                // Step 1: Authenticate with Supabase
                JSONObject authResponse = authenticateWithSupabase(email, password);
                
                if (authResponse == null) {
                    runOnUiThread(() -> {
                        showError("Invalid credentials");
                        setLoading(false);
                    });
                    return;
                }

                String accessToken = authResponse.getString("access_token");
                String refreshToken = authResponse.getString("refresh_token");
                String userId = authResponse.getJSONObject("user").getString("id");

                Log.d(TAG, "Authentication successful for user: " + userId);

                // Step 2: Verify user is admin
                boolean isAdmin = checkAdminRole(userId, accessToken);
                
                if (!isAdmin) {
                    runOnUiThread(() -> {
                        showError("Access denied. Admin privileges required.");
                        setLoading(false);
                    });
                    return;
                }

                // Step 3: Store auth tokens
                AuthTokenManager tokenManager = new AuthTokenManager(this);
                tokenManager.storeAuthToken(accessToken, refreshToken);

                Log.d(TAG, "Login successful - navigating to main activity");

                runOnUiThread(() -> {
                    setLoading(false);
                    navigateToMainActivity();
                });

            } catch (Exception e) {
                Log.e(TAG, "Login error", e);
                runOnUiThread(() -> {
                    showError("Login failed: " + e.getMessage());
                    setLoading(false);
                });
            }
        }).start();
    }

    private JSONObject authenticateWithSupabase(String email, String password) {
        try {
            URL url = new URL(SUPABASE_URL + "/auth/v1/token?grant_type=password");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
            conn.setDoOutput(true);

            JSONObject payload = new JSONObject();
            payload.put("email", email);
            payload.put("password", password);

            OutputStream os = conn.getOutputStream();
            os.write(payload.toString().getBytes("UTF-8"));
            os.close();

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Auth response code: " + responseCode);

            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                br.close();
                
                return new JSONObject(response.toString());
            } else {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getErrorStream()));
                StringBuilder errorResponse = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    errorResponse.append(line);
                }
                br.close();
                Log.e(TAG, "Auth error: " + errorResponse.toString());
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Authentication failed", e);
        }
        
        return null;
    }

    private boolean checkAdminRole(String userId, String accessToken) {
        try {
            URL url = new URL(SUPABASE_URL + "/rest/v1/user_roles?user_id=eq." + userId + "&role=eq.admin");
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            
            conn.setRequestMethod("GET");
            conn.setRequestProperty("apikey", SUPABASE_ANON_KEY);
            conn.setRequestProperty("Authorization", "Bearer " + accessToken);

            int responseCode = conn.getResponseCode();
            Log.d(TAG, "Admin check response code: " + responseCode);

            if (responseCode == 200) {
                BufferedReader br = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                StringBuilder response = new StringBuilder();
                String line;
                while ((line = br.readLine()) != null) {
                    response.append(line);
                }
                br.close();
                
                String responseStr = response.toString();
                Log.d(TAG, "Admin check response: " + responseStr);
                
                // Check if response is an array with at least one item
                return responseStr.startsWith("[") && !responseStr.equals("[]");
            }

            conn.disconnect();
        } catch (Exception e) {
            Log.e(TAG, "Admin check failed", e);
        }
        
        return false;
    }

    private void showError(String message) {
        errorText.setText(message);
        errorText.setVisibility(View.VISIBLE);
    }

    private void setLoading(boolean loading) {
        progressBar.setVisibility(loading ? View.VISIBLE : View.GONE);
        loginButton.setEnabled(!loading);
        emailInput.setEnabled(!loading);
        passwordInput.setEnabled(!loading);
    }

    private void navigateToMainActivity() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        finish();
    }
}
