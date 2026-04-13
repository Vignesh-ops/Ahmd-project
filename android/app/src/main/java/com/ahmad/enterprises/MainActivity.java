package com.ahmad.enterprises;

import android.graphics.Color;
import android.os.Bundle;

import com.ahmad.enterprises.plugins.BluetoothPrinterPlugin;
import com.ahmad.enterprises.plugins.WebPrintPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(BluetoothPrinterPlugin.class);
        registerPlugin(WebPrintPlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.BLACK);
        getWindow().setNavigationBarColor(Color.BLACK);
        if (getBridge() != null && getBridge().getWebView() != null) {
            getBridge().getWebView().setBackgroundColor(Color.BLACK);
        }
    }
}
