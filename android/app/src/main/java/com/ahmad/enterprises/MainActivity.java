// MainActivity.java
package com.ahmad.enterprises;

import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.webkit.WebView;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

import androidx.core.splashscreen.SplashScreen;

import com.ahmad.enterprises.plugins.AppInfoPlugin;
import com.ahmad.enterprises.plugins.BluetoothPrinterPlugin;
import com.ahmad.enterprises.plugins.DocumentSaverPlugin;
import com.ahmad.enterprises.plugins.WebPrintPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private boolean keepSplashOnScreen = true;
    private View offlineOverlay;
    private ConnectivityManager connectivityManager;
    private ConnectivityManager.NetworkCallback networkCallback;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> keepSplashOnScreen);
        bridgeBuilder.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    keepSplashOnScreen = false;
                    hideOfflineOverlay();
                }

                @Override
                public void onReceivedError(WebView webView) {
                    keepSplashOnScreen = false;
                    showOfflineOverlay(webView);
                }

                @Override
                public void onReceivedHttpError(WebView webView) {
                    keepSplashOnScreen = false;
                }
            }
        );
        registerPlugin(AppInfoPlugin.class);
        registerPlugin(BluetoothPrinterPlugin.class);
        registerPlugin(DocumentSaverPlugin.class);
        registerPlugin(WebPrintPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawableResource(R.drawable.launch_background);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.setBackgroundColor(Color.TRANSPARENT);
            View parent = (View) webView.getParent();
            if (parent != null) {
                parent.setBackgroundResource(R.drawable.launch_background);
            }
        }
        registerNetworkRetry();
    }

    @Override
    public void onResume() {
        super.onResume();

        if (offlineOverlay != null && isOnline() && getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().reload();
        }
    }

    @Override
    public void onDestroy() {
        if (connectivityManager != null && networkCallback != null) {
            try {
                connectivityManager.unregisterNetworkCallback(networkCallback);
            } catch (Exception ignored) {
                // Callback may already be unregistered by the system.
            }
        }

        super.onDestroy();
    }

    private void registerNetworkRetry() {
        connectivityManager = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);

        if (connectivityManager == null) {
            return;
        }

        networkCallback =
            new ConnectivityManager.NetworkCallback() {
                @Override
                public void onAvailable(Network network) {
                    runOnUiThread(() -> {
                        if (offlineOverlay != null && getBridge() != null && getBridge().getWebView() != null) {
                            getBridge().getWebView().reload();
                        }
                    });
                }
            };

        try {
            connectivityManager.registerDefaultNetworkCallback(networkCallback);
        } catch (Exception ignored) {
            networkCallback = null;
        }
    }

    private boolean isOnline() {
        if (connectivityManager == null) {
            return false;
        }

        Network network = connectivityManager.getActiveNetwork();
        if (network == null) {
            return false;
        }

        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        return capabilities != null && capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET);
    }

    private void showOfflineOverlay(WebView webView) {
        runOnUiThread(() -> {
            if (offlineOverlay != null) {
                return;
            }

            FrameLayout overlay = new FrameLayout(this);
            overlay.setBackgroundColor(Color.WHITE);
            overlay.setClickable(true);

            LinearLayout card = new LinearLayout(this);
            card.setOrientation(LinearLayout.VERTICAL);
            card.setGravity(Gravity.CENTER_HORIZONTAL);
            card.setPadding(dp(22), dp(20), dp(22), dp(20));
            card.setBackgroundColor(Color.WHITE);

            TextView title = new TextView(this);
            title.setText("No internet");
            title.setTextColor(Color.rgb(24, 24, 27));
            title.setTextSize(22);
            title.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
            title.setGravity(Gravity.CENTER);

            TextView message = new TextView(this);
            message.setText("Reconnect and retry. The app will resume automatically.");
            message.setTextColor(Color.rgb(82, 82, 91));
            message.setTextSize(15);
            message.setGravity(Gravity.CENTER);
            message.setPadding(0, dp(8), 0, dp(16));

            Button retry = new Button(this);
            retry.setText("Retry");
            retry.setAllCaps(false);
            retry.setTextSize(15);
            retry.setOnClickListener(view -> {
                if (isOnline()) {
                    hideOfflineOverlay();
                }
                webView.reload();
            });

            card.addView(title, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            card.addView(message, new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ));
            card.addView(retry, new LinearLayout.LayoutParams(dp(124), dp(48)));

            FrameLayout.LayoutParams cardParams = new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER
            );
            cardParams.setMargins(dp(32), 0, dp(32), 0);

            overlay.addView(card, cardParams);
            addContentView(overlay, new FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            ));
            offlineOverlay = overlay;
        });
    }

    private void hideOfflineOverlay() {
        runOnUiThread(() -> {
            if (offlineOverlay == null) {
                return;
            }

            View parent = (View) offlineOverlay.getParent();
            if (parent instanceof FrameLayout) {
                ((FrameLayout) parent).removeView(offlineOverlay);
            }
            offlineOverlay = null;
        });
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }
}
