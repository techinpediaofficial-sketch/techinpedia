<?php
echo "Killing node processes...<br>";
system('killall -9 node 2>&1', $retval);
echo "Exit status: $retval<br>";
echo "Done.";
?>
