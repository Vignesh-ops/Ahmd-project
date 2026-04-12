package com.ahmad.enterprises.plugins;

import android.content.Context;
import android.os.Build;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;

import com.getcapacitor.Bridge;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WebPrint")
public class WebPrintPlugin extends Plugin {
    @PluginMethod
    public void printCurrentPage(PluginCall call) {
        Bridge bridge = getBridge();
        if (bridge == null || getActivity() == null) {
            call.reject("Printing is not available right now.");
            return;
        }

        WebView webView = bridge.getWebView();
        if (webView == null) {
            call.reject("WebView is not ready for printing.");
            return;
        }

        String title = call.getString("title", getActivity().getTitle() != null
            ? getActivity().getTitle().toString()
            : "AHMAD Enterprises");

        getActivity().runOnUiThread(() -> {
            try {
                PrintManager printManager = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                if (printManager == null) {
                    call.reject("Android print service is unavailable.");
                    return;
                }

                PrintDocumentAdapter printAdapter = Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP
                    ? webView.createPrintDocumentAdapter(title)
                    : webView.createPrintDocumentAdapter();

                printManager.print(
                    title,
                    printAdapter,
                    new PrintAttributes.Builder().build()
                );

                call.resolve();
            } catch (Exception error) {
                call.reject("Failed to open Android print dialog.", error);
            }
        });
    }
}
