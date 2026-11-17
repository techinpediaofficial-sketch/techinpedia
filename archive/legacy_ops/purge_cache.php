<?php
// LiteSpeed Cache Purge Script
// Access this file once in browser to clear all LS cache

// Method 1: LiteSpeed native purge header
header('X-LiteSpeed-Purge: *');
header('X-LiteSpeed-Tag: *');
header('Cache-Control: no-cache, no-store, must-revalidate');

// Method 2: LiteSpeed API if available
if (function_exists('litespeed_purge_all')) {
    litespeed_purge_all();
    echo "✅ LiteSpeed cache purged via API\n";
}

// Method 3: Delete LiteSpeed cache files manually
$cache_dirs = [
    '/home/xxfeszkb/lscache/',
    '/home/xxfeszkb/.litespeed/',
    sys_get_temp_dir() . '/lscache/',
];

$deleted = 0;
foreach ($cache_dirs as $dir) {
    if (is_dir($dir)) {
        $files = glob($dir . '*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
                $deleted++;
            }
        }
        echo "✅ Cleared: $dir ($deleted files)\n";
    }
}

echo "\n🎉 Cache purge complete! Visit https://techinpedia.in/services now.\n";
echo "Timestamp: " . date('Y-m-d H:i:s') . "\n";
?>
