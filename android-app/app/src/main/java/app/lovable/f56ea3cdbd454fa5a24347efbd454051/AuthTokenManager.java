package app.lovable.f56ea3cdbd454fa5a24347efbd454051;

import android.content.Context;
import android.content.SharedPreferences;
import android.webkit.JavascriptInterface;
import android.util.Log;

/**
 * Manages authentication tokens for Supabase
 * This class provides a JavaScript interface for the WebView to store auth tokens
 * and methods for the SMS receiver to retrieve them
 */
public class AuthTokenManager {
    private static final String TAG = "AuthTokenManager";
    private static final String PREFS_NAME = "supabase_auth";
    private static final String KEY_ACCESS_TOKEN = "access_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    
    private Context context;
    
    public AuthTokenManager(Context context) {
        this.context = context;
    }
    
    /**
     * Called by WebView JavaScript to store auth token
     * Usage in web: window.Android.storeAuthToken(accessToken, refreshToken)
     */
    @JavascriptInterface
    public void storeAuthToken(String accessToken, String refreshToken) {
        Log.d(TAG, "Storing auth tokens");
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putString(KEY_ACCESS_TOKEN, accessToken);
        editor.putString(KEY_REFRESH_TOKEN, refreshToken);
        editor.apply();
        Log.d(TAG, "Auth tokens stored successfully");
    }
    
    /**
     * Called by WebView JavaScript to clear auth tokens on logout
     */
    @JavascriptInterface
    public void clearAuthToken() {
        Log.d(TAG, "Clearing auth tokens");
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().clear().apply();
    }
    
    /**
     * Retrieve stored access token
     * Used by SMS receiver to authenticate API requests
     */
    public static String getAccessToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        return prefs.getString(KEY_ACCESS_TOKEN, null);
    }
    
    /**
     * Check if user is authenticated
     */
    public static boolean isAuthenticated(Context context) {
        return getAccessToken(context) != null;
    }
}
