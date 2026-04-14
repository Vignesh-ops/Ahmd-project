package com.ahmad.enterprises.plugins;

import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AppInfo")
public class AppInfoPlugin extends Plugin {
    @PluginMethod
    public void getInfo(PluginCall call) {
        try {
            PackageManager packageManager = getContext().getPackageManager();
            String packageName = getContext().getPackageName();
            PackageInfo packageInfo = packageManager.getPackageInfo(packageName, 0);

            JSObject result = new JSObject();
            result.put("packageName", packageName);
            result.put("versionName", packageInfo.versionName != null ? packageInfo.versionName : "");

            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? packageInfo.getLongVersionCode()
                : packageInfo.versionCode;
            result.put("versionCode", versionCode);

            call.resolve(result);
        } catch (Exception error) {
            call.reject("Unable to read app info.", error);
        }
    }
}
