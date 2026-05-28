package com.ahmad.enterprises.plugins;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;

import androidx.activity.result.ActivityResult;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.OutputStream;

@CapacitorPlugin(name = "DocumentSaver")
public class DocumentSaverPlugin extends Plugin {
    private String pendingFileName;

    @PluginMethod
    public void createFile(PluginCall call) {
        String fileName = call.getString("fileName", "Data.xlsx");
        String mimeType = call.getString("mimeType", "application/octet-stream");

        if (fileName == null || fileName.trim().isEmpty()) {
            call.reject("File name is required.");
            return;
        }

        if (getActivity() == null) {
            call.reject("Android save picker is not available right now.");
            return;
        }

        pendingFileName = fileName;

        Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
        intent.addCategory(Intent.CATEGORY_OPENABLE);
        intent.setType(mimeType);
        intent.putExtra(Intent.EXTRA_TITLE, fileName);
        intent.addFlags(
            Intent.FLAG_GRANT_READ_URI_PERMISSION |
            Intent.FLAG_GRANT_WRITE_URI_PERMISSION |
            Intent.FLAG_GRANT_PERSISTABLE_URI_PERMISSION
        );

        startActivityForResult(call, intent, "handleCreateFileResult");
    }

    @ActivityCallback
    private void handleCreateFileResult(PluginCall call, ActivityResult result) {
        String fileName = pendingFileName != null ? pendingFileName : "Data.xlsx";
        pendingFileName = null;

        if (call == null) {
            return;
        }

        Intent data = result.getData();
        Uri uri = data != null ? data.getData() : null;

        if (result.getResultCode() != Activity.RESULT_OK || uri == null) {
            JSObject response = new JSObject();
            response.put("canceled", true);
            response.put("filename", fileName);
            call.resolve(response);
            return;
        }

        try {
            getContext().getContentResolver().takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            );
        } catch (Exception ignored) {
            // The current result grant is still enough for the immediate write.
        }

        JSObject response = new JSObject();
        response.put("uri", uri.toString());
        response.put("filename", fileName);
        call.resolve(response);
    }

    @PluginMethod
    public void writeFile(PluginCall call) {
        String uriString = call.getString("uri");
        String base64Data = call.getString("base64Data");
        String fileName = call.getString("fileName", "Data.xlsx");

        if (uriString == null || uriString.trim().isEmpty()) {
            call.reject("Save location is required.");
            return;
        }

        if (base64Data == null || base64Data.isEmpty()) {
            call.reject("File data is required.");
            return;
        }

        try {
            byte[] bytes = Base64.decode(base64Data, Base64.DEFAULT);
            Uri uri = Uri.parse(uriString);

            try (OutputStream outputStream = getContext().getContentResolver().openOutputStream(uri, "w")) {
                if (outputStream == null) {
                    call.reject("Could not open the selected file.");
                    return;
                }

                outputStream.write(bytes);
            }

            JSObject response = new JSObject();
            response.put("saved", true);
            response.put("uri", uriString);
            response.put("filename", fileName);
            call.resolve(response);
        } catch (Exception error) {
            call.reject("Could not save XLSX file.", error);
        }
    }
}
