// BluetoothPrinterPlugin.java
package com.ahmad.enterprises.plugins;

import android.Manifest;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothManager;
import android.bluetooth.BluetoothSocket;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import androidx.annotation.Keep;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.OutputStream;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(
    name = "BluetoothPrinter",
    permissions = {
        @Permission(
            strings = { Manifest.permission.BLUETOOTH, Manifest.permission.BLUETOOTH_ADMIN },
            alias = "bluetoothLegacy"
        ),
        @Permission(
            strings = { Manifest.permission.ACCESS_FINE_LOCATION },
            alias = "location"
        ),
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_SCAN },
            alias = "bluetoothScan"
        ),
        @Permission(
            strings = { Manifest.permission.BLUETOOTH_CONNECT },
            alias = "bluetoothConnect"
        )
    }
)
public class BluetoothPrinterPlugin extends Plugin {

    private static final UUID SPP_UUID = UUID.fromString("00001101-0000-1000-8000-00805f9b34fb");

    private BluetoothAdapter adapter;
    private BroadcastReceiver discoveryReceiver;
    private final ConcurrentHashMap<String, BluetoothSocket> sockets = new ConcurrentHashMap<>();

    @Override
    public void load() {
        BluetoothManager manager =
            (BluetoothManager) getContext().getSystemService(Context.BLUETOOTH_SERVICE);
        adapter = (manager != null) ? manager.getAdapter() : BluetoothAdapter.getDefaultAdapter();
    }

    @Override
    protected void handleOnDestroy() {
        stopDiscoveryInternal();
        for (BluetoothSocket socket : sockets.values()) {
            try { socket.close(); } catch (Exception ignored) {}
        }
        sockets.clear();
        super.handleOnDestroy();
    }

    // KEY FIX: Never pass two aliases to requestPermissionForAliases() at once on Android 12+.
    // Requesting multiple runtime permissions simultaneously crashes on Android 15.
    // Solution: chain one alias at a time via separate @PermissionCallback methods.

    @PluginMethod
    public void requestPermissions(PluginCall call) {
        if (hasConnectPermission() && hasScanPermission()) {
            call.resolve(permissionStatesToJs());
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            if (!hasConnectPermission()) {
                // Step 1: ask CONNECT; onConnectPermissionResult will ask SCAN if needed
                requestPermissionForAlias("bluetoothConnect", call, "onConnectPermissionResult");
            } else {
                // CONNECT already granted, only need SCAN
                requestPermissionForAlias("bluetoothScan", call, "permissionRequestCallback");
            }
        } else {
            requestPermissionForAliases(
                new String[]{ "bluetoothLegacy", "location" },
                call, "permissionRequestCallback"
            );
        }
    }

    @PermissionCallback
    @Keep
    public void onConnectPermissionResult(PluginCall call) {
        if (!hasScanPermission()) {
            requestPermissionForAlias("bluetoothScan", call, "permissionRequestCallback");
        } else {
            call.resolve(permissionStatesToJs());
        }
    }

@PluginMethod
public void requestScanPermissions(PluginCall call) {
    if (hasScanPermission()) {
        call.resolve(permissionStatesToJs());
        return;
    }

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        requestPermissionForAliases(
            new String[] { "bluetoothScan", "bluetoothConnect" },
            call,
            "permissionRequestCallback"
        );
    } else {
        requestPermissionForAliases(
            new String[] { "bluetoothLegacy", "location" },
            call,
            "permissionRequestCallback"
        );
    }
}

    @PermissionCallback
    @Keep
    public void onConnectForScanResult(PluginCall call) {
        requestPermissionForAlias("bluetoothScan", call, "permissionRequestCallback");
    }

    @PluginMethod
    public void requestConnectPermissions(PluginCall call) {
        if (hasConnectPermission()) {
            call.resolve(permissionStatesToJs());
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            requestPermissionForAlias("bluetoothConnect", call, "permissionRequestCallback");
        } else {
            requestPermissionForAlias("bluetoothLegacy", call, "permissionRequestCallback");
        }
    }

    @PermissionCallback
    @Keep
    public void permissionRequestCallback(PluginCall call) {
        call.resolve(permissionStatesToJs());
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            intent.setData(Uri.fromParts("package", getContext().getPackageName(), null));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to open app settings: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void isEnabled(PluginCall call) {
        JSObject result = new JSObject();
        result.put("enabled", adapter != null && adapter.isEnabled());
        call.resolve(result);
    }

    @PluginMethod
    public void getPairedDevices(PluginCall call) {
        if (adapter == null)         { call.reject("Bluetooth not available"); return; }
        if (!hasConnectPermission()) { call.reject("Bluetooth permission denied"); return; }
        if (!adapter.isEnabled())    { call.reject("Bluetooth is disabled"); return; }

        JSArray devices = new JSArray();
        try {
            Set<BluetoothDevice> bonded = adapter.getBondedDevices();
            if (bonded != null) {
                for (BluetoothDevice device : bonded) devices.put(deviceToJs(device));
            }
        } catch (SecurityException e) {
            call.reject("Bluetooth permission denied", e);
            return;
        }
        JSObject result = new JSObject();
        result.put("devices", devices);
        call.resolve(result);
    }

    @PluginMethod
    public void startDiscovery(PluginCall call) {
        try {
            if (adapter == null)       { call.reject("Bluetooth not available"); return; }
            if (!hasScanPermission()) {
    JSObject result = new JSObject();
    result.put("error", "permission_denied");
    call.resolve(result);
    return;
}
            if (!adapter.isEnabled())  { call.reject("Bluetooth is disabled"); return; }

            stopDiscoveryInternal();

            discoveryReceiver = new BroadcastReceiver() {
                @Override
                public void onReceive(Context context, Intent intent) {
                    String action = intent.getAction();
                    if (BluetoothDevice.ACTION_FOUND.equals(action)) {
                        BluetoothDevice device = intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE);
                        if (device != null) notifyListeners("deviceFound", deviceToJs(device));
                    } else if (BluetoothAdapter.ACTION_DISCOVERY_FINISHED.equals(action)) {
                        notifyListeners("discoveryFinished", new JSObject());
                    }
                }
            };

            IntentFilter filter = new IntentFilter();
            filter.addAction(BluetoothDevice.ACTION_FOUND);
            filter.addAction(BluetoothAdapter.ACTION_DISCOVERY_FINISHED);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                getContext().registerReceiver(discoveryReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
            } else {
                getContext().registerReceiver(discoveryReceiver, filter);
            }

            if (!adapter.startDiscovery()) {
                call.reject("Bluetooth discovery could not start. Is Bluetooth enabled?");
                return;
            }
            call.resolve();
        } catch (Exception e) {
            stopDiscoveryInternal();
            call.reject("Failed to start Bluetooth discovery: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void stopDiscovery(PluginCall call) {
        stopDiscoveryInternal();
        call.resolve();
    }

    @PluginMethod
    public void pair(PluginCall call) {
        if (adapter == null)         { call.reject("Bluetooth not available"); return; }
        if (!hasConnectPermission()) { call.reject("Bluetooth permission denied"); return; }
        if (!adapter.isEnabled())    { call.reject("Bluetooth is disabled"); return; }

        String address = call.getString("address", "");
        if (address.isEmpty())       { call.reject("Missing address"); return; }

        try {
            BluetoothDevice device = adapter.getRemoteDevice(address);
            JSObject result = new JSObject();
            result.put("started", device.createBond());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to pair: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void connect(PluginCall call) {
        if (adapter == null)         { call.reject("Bluetooth not available"); return; }
        if (!hasConnectPermission()) { call.reject("Bluetooth permission denied"); return; }
        if (!adapter.isEnabled())    { call.reject("Bluetooth is disabled"); return; }

        String address = call.getString("address", "");
        if (address.isEmpty())       { call.reject("Missing address"); return; }

        try {
            BluetoothSocket socket = ensureConnectedSocket(address, false);
            JSObject result = new JSObject();
            result.put("connected", socket != null && socket.isConnected());
            call.resolve(result);
        } catch (Exception e) {
            call.reject("Failed to connect: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void disconnect(PluginCall call) {
        String address = call.getString("address", "");
        if (address.isEmpty()) { call.reject("Missing address"); return; }
        BluetoothSocket socket = sockets.remove(address);
        if (socket != null) { try { socket.close(); } catch (Exception ignored) {} }
        call.resolve();
    }

    @PluginMethod
    public void print(PluginCall call) {
        if (adapter == null)         { call.reject("Bluetooth not available"); return; }
        if (!hasConnectPermission()) { call.reject("Bluetooth permission denied"); return; }
        if (!adapter.isEnabled())    { call.reject("Bluetooth is disabled"); return; }

        String address = call.getString("address", "");
        String data    = call.getString("data", "");
        if (address.isEmpty()) { call.reject("Missing address"); return; }
        if (data.isEmpty())    { call.reject("No data"); return; }

        try {
            writeToSocket(address, Base64.decode(data, Base64.DEFAULT), false);
            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to print: " + e.getMessage(), e);
        }
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────────

    private void stopDiscoveryInternal() {
        if (adapter != null) {
            try { if (adapter.isDiscovering()) adapter.cancelDiscovery(); }
            catch (SecurityException ignored) {}
        }
        if (discoveryReceiver != null) {
            try { getContext().unregisterReceiver(discoveryReceiver); }
            catch (Exception ignored) {}
            discoveryReceiver = null;
        }
    }

    private boolean hasConnectPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return isPermissionGranted(Manifest.permission.BLUETOOTH_CONNECT);
        }
        return isPermissionGranted(Manifest.permission.BLUETOOTH);
    }

    private boolean hasScanPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            return isPermissionGranted(Manifest.permission.BLUETOOTH_SCAN)
                && isPermissionGranted(Manifest.permission.BLUETOOTH_CONNECT);
        }
        return isPermissionGranted(Manifest.permission.BLUETOOTH)
            && isPermissionGranted(Manifest.permission.ACCESS_FINE_LOCATION);
    }

    private JSObject permissionStatesToJs() {
        boolean connect = hasConnectPermission();
        boolean scan    = hasScanPermission();
        JSObject out = new JSObject();
        out.put("connectGranted",   connect);
        out.put("scanGranted",      scan);
        out.put("bluetoothConnect", connect ? "granted" : "denied");
        out.put("bluetoothScan",    scan    ? "granted" : "denied");
        return out;
    }

    private boolean isPermissionGranted(String permission) {
        return ContextCompat.checkSelfPermission(getContext(), permission)
            == PackageManager.PERMISSION_GRANTED;
    }

    private BluetoothSocket ensureConnectedSocket(String address, boolean forceReconnect) throws Exception {
        BluetoothSocket socket = sockets.get(address);
        if (!forceReconnect && socket != null && socket.isConnected()) return socket;
        closeSocket(address);
        BluetoothDevice device = adapter.getRemoteDevice(address);
        adapter.cancelDiscovery();
        BluetoothSocket fresh = device.createRfcommSocketToServiceRecord(SPP_UUID);
        fresh.connect();
        sockets.put(address, fresh);
        return fresh;
    }

    private void writeToSocket(String address, byte[] bytes, boolean hasRetried) throws Exception {
        try {
            OutputStream out = ensureConnectedSocket(address, false).getOutputStream();
            out.write(bytes);
            out.flush();
        } catch (Exception e) {
            closeSocket(address);
            if (hasRetried) throw e;
            OutputStream out = ensureConnectedSocket(address, true).getOutputStream();
            out.write(bytes);
            out.flush();
        }
    }

    private void closeSocket(String address) {
        BluetoothSocket socket = sockets.remove(address);
        if (socket != null) { try { socket.close(); } catch (Exception ignored) {} }
    }

    private JSObject deviceToJs(BluetoothDevice device) {
        JSObject data = new JSObject();
        try { data.put("name", device.getName() != null ? device.getName() : ""); }
        catch (SecurityException ignored) { data.put("name", ""); }
        try { data.put("address", device.getAddress()); }
        catch (SecurityException ignored) { data.put("address", ""); }
        try { data.put("bonded", device.getBondState() == BluetoothDevice.BOND_BONDED); }
        catch (SecurityException ignored) { data.put("bonded", false); }
        return data;
    }
}