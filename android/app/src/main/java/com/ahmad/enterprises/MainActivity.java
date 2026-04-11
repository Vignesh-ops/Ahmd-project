package com.ahmad.enterprises;

import android.os.Bundle;

import com.ahmad.enterprises.plugins.BluetoothPrinterPlugin;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(BluetoothPrinterPlugin.class);
    }
}
