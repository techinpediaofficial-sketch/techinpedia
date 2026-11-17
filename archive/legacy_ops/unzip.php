<?php
// PHP Zip Extractor & Cache Purger for TechInPedia
function rrmdir($dir) {
    if (is_dir($dir)) {
        $objects = scandir($dir);
        foreach ($objects as $object) {
            if ($object != "." && $object != "..") {
                if (is_dir($dir . "/" . $object) && !is_link($dir . "/" . $object))
                    rrmdir($dir . "/" . $object);
                else
                    unlink($dir . "/" . $object);
            }
        }
        rmdir($dir);
    }
}

// 1. Delete old .next directory to avoid stale JS chunks
if (is_dir(__DIR__ . '/.next')) {
    rrmdir(__DIR__ . '/.next');
}

// 2. Extract new build zip
$zip = new ZipArchive;
if ($zip->open('techinpedia_deploy_opt.zip') === TRUE) {
    $zip->extractTo(__DIR__);
    $zip->close();
    echo "EXTRACTED_SUCCESSFULLY";
    
    // 3. Touch restart.txt for Passenger reload
    @mkdir(__DIR__ . '/tmp');
    @touch(__DIR__ . '/tmp/restart.txt');
    @unlink(__FILE__);
} else {
    echo "ZIP_OPEN_FAILED";
}
?>
