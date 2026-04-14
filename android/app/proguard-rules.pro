# Keep all Capacitor core classes
-keep class com.getcapacitor.** { *; }

# Keep your custom plugin (IMPORTANT)
-keep class com.ahmad.enterprises.plugins.** { *; }

# Keep all methods annotated with @PluginMethod
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod <methods>;
}

# Keep Capacitor plugin annotations
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }

# Keep annotation metadata (VERY IMPORTANT)
-keepattributes *Annotation*

# Keep reflection-used methods (extra safety)
-keepclassmembers class * {
    public *;
}

# Prevent stripping of JS bridge calls
-keepclassmembers class com.getcapacitor.Plugin {
    public *;
}