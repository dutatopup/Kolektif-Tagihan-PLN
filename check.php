<?php
// Konfigurasi API
require_once 'core/config.php';

// Set header untuk JSON response
header('Content-Type: application/json; charset=utf-8');

// Optimasi untuk HTTP/2
if (function_exists('header_remove')) {
    header_remove('X-Powered-By');
    header_remove('Server');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && !empty($_POST['idpel'])) {
    $idpel = trim($_POST['idpel']);
    $type = $_POST['type'] ?? 'postpaid';

    // Build URL
    $url = BASE_URL . urlencode($idpel) . 
          ($type === 'prepaid' ? '/token_pln' : '/postpaid');

    // Optimized cURL untuk HTTP/2
    $ch = curl_init();
    
    $curlOptions = [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_2_0,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_ENCODING => 'gzip, deflate',
        CURLOPT_HTTPHEADER => [
            "X-RapidAPI-Key: " . API_KEY,
            "X-RapidAPI-Host: " . API_HOST,
            "Accept: application/json",
            "Accept-Encoding: gzip, deflate",
            "Connection: keep-alive"
        ]
    ];
    
    curl_setopt_array($ch, $curlOptions);
    
    $response = curl_exec($ch);
    $err = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Handle connection errors
    if ($err) {
        echo json_encode(['success' => false, 'error' => "Connection Error: $err"]);
        exit;
    }
    
    // Handle HTTP errors
    if ($httpCode != 200) {
        echo json_encode(['success' => false, 'error' => "HTTP Error $httpCode"]);
        exit;
    }

    // Parse JSON response
    $json = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode(['success' => false, 'error' => 'Invalid JSON response from API']);
        exit;
    }
    
    // Handle API response based on success status
    if (isset($json['success']) && $json['success'] === false) {
        // API mengembalikan error
        $errorData = $json['data'] ?? [];
        $errorMessage = $errorData['message'] ?? 'Unknown error from API';
        $errorCode = $errorData['code'] ?? 0;
        
        echo json_encode([
            'success' => false, 
            'error' => $errorMessage,
            'code' => $errorCode
        ]);
        exit;
    }
    
    // Handle successful response
    if (isset($json['success']) && $json['success'] === true) {
        // Process data based on type
        if ($type === 'prepaid') {
            $data = $json['data'] ?? [];
            
            echo json_encode([
                'success' => true,
                'meter_number' => $data['meter_number'] ?? 'Data tidak tersedia',
                'subscriber_id' => $data['subscriber_id'] ?? 'Data tidak tersedia',
                'subscriber_name' => $data['subscriber_name'] ?? 'Data tidak tersedia',
                'segment_power' => $data['segment_power'] ?? 'Data tidak tersedia'
            ]);
        } else {
            $data = $json['data'] ?? [];
            $billDetail = $data['bill_detail'][0] ?? [];
            
            echo json_encode([
                'success' => true,
                'nama' => $data['subscriber_name'] ?? 'Data tidak tersedia',
                'tarif' => $billDetail['segment_power'] ?? 'Data tidak tersedia',
                'periode' => $billDetail['period'] ?? 'Data tidak tersedia',
                'bulan' => $billDetail['qty'] ?? 'Data tidak tersedia',
                'stand' => $billDetail['stand_meter'] ?? 'Data tidak tersedia',
                'tagihan' => $data['total_bill'] ?? 0
            ]);
        }
    } else {
        // Unknown response format
        echo json_encode(['success' => false, 'error' => 'Invalid API response format']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'ID Pelanggan tidak valid']);
}
?>