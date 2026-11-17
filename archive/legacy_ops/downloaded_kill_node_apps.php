<?php
header("Content-Type: text/plain");
ini_set("display_errors", 1);

echo "=== CURRENT ACTIVE PROCESSES FOR USER ===\n";
$ps_output = [];
@exec("ps aux 2>&1", $ps_output);
echo implode("\n", $ps_output) . "\n\n";

echo "=== KILLING HUNG NODE & PASSENGER PROCESSES ===\n";
$kill_output = [];
@exec("pkill -9 -u $(whoami) node 2>&1", $kill_output);
@exec("pkill -9 -u $(whoami) Passenger 2>&1", $kill_output);
echo "Kill command issued.\n\n";

sleep(1);

echo "=== PROCESSES AFTER KILL ===\n";
$ps_after = [];
@exec("ps aux 2>&1", $ps_after);
echo implode("\n", $ps_after) . "\n";
