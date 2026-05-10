// MainActivity.java
package com.ahmad.enterprises;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.splashscreen.SplashScreen;

import com.ahmad.enterprises.plugins.AppInfoPlugin;
import com.ahmad.enterprises.plugins.BluetoothPrinterPlugin;
import com.ahmad.enterprises.plugins.WebPrintPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    private boolean keepSplashOnScreen = true;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> keepSplashOnScreen);
        bridgeBuilder.addWebViewListener(
            new WebViewListener() {
                @Override
                public void onPageLoaded(WebView webView) {
                    keepSplashOnScreen = false;
                }

                @Override
                public void onReceivedError(WebView webView) {
                    keepSplashOnScreen = false;
                }

                @Override
                public void onReceivedHttpError(WebView webView) {
                    keepSplashOnScreen = false;
                }
            }
        );
        registerPlugin(AppInfoPlugin.class);
        registerPlugin(BluetoothPrinterPlugin.class);
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
    }
}
