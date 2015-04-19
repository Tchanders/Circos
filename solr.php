<?php

header('Content-Type: application/json');

$url = "http://localhost:8983/solr/circos/select";

$ch = curl_init();

curl_setopt($ch,CURLOPT_URL, $url);
curl_setopt($ch,CURLOPT_POST, count($_POST));
curl_setopt($ch,CURLOPT_POSTFIELDS, http_build_query($_POST));
curl_setopt($ch,CURLOPT_RETURNTRANSFER, 1);

echo curl_exec($ch); // == '{name:value}'

curl_close($ch);