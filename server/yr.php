<?php
// parse data
if (empty($_POST["word"]) && !empty($_GET["word"])) {
    $word = $_GET["word"];
} else if (!empty($_POST["word"])) { 
    $word = $_POST["word"];
} else {
	die("No words found.");
}

// Create connection
$conn = new mysqli('127.0.0.1', 'admin', 'xxx', 'statistics');

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} 


$sql = "SELECT COUNT(*) FROM translations WHERE sentence='".$word."'";
$result = $conn->query($sql);
//var_dump($result);
if ($result->num_rows > 0) {
	$row = $result->fetch_assoc();
	$total = $row["COUNT(*)"];
	//var_dump($total);
	if ($total == 0) {	
		$sql = "INSERT INTO translations (sentence) VALUES ('".$word."')";
		$conn->query($sql);
	}
} else {
	//var_dump("p*".$total);
	$sql = "INSERT INTO translations (sentence) VALUES ('".$word."')";
	$conn->query($sql);
}

$conn->close();

?>
