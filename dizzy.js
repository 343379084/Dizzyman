const API_HOST = 'dlabel.ctaiot.com';
const VIP_PATHS = ['/api/welfare/list', '/api/push/list'];
const SHAREID_KEY = 'dlabel_share_user_id';
 
// 获取当前有效Token（需定期更新）
function getDynamicToken() {
    return 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwicm9sZSI6InVzZXIiLCJleHAiOjE5MDAwMDAwMDAsImlhdCI6MTcxODUxODQwMH0.NewValidTokenStringHere';
}
 
function modifyResponse(body) {
    try {
        const jsonBody = JSON.parse(body);
        
        // 安全处理数据 
        if (jsonBody?.data?.length > 0) {
            jsonBody.data.forEach(item => {
                item.isVip = 1;
                item.expireTime = "2099-12-31";
            });
        }
 
        // 提取并存储分享ID 
        const shareIdMatch = body.match(/shareUserId=(\d+)/);
        if (shareIdMatch?.[1]) {
            $prefs.setValueForKey(shareIdMatch[1], SHAREID_KEY);
        }
 
        return JSON.stringify(jsonBody);
    } catch (e) {
        console.log(`JSON处理失败: ${e.message}`);
        return body;
    }
}
 
function sendPostRequest(shareId) {
    const url = `https://${API_HOST}/api/push/task`;
    const headers = {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x1800322a)',
        'Authorization': `Bearer ${getDynamicToken()}`,
        'Content-Type': 'application/x-www-form-urlencoded'
    };
    
    $task.fetch({
        url: url,
        method: 'POST',
        headers: headers,
        body: `shareUserId=${shareId}`
    }).then(response => {
        console.log(`推送成功: ${response.statusCode}`);
    }, reason => {
        console.log(`推送失败: ${reason.error}`);
    });
}
 
// 主执行逻辑 
if (VIP_PATHS.some(path => $request.url.includes(path))) {
    const modifiedBody = modifyResponse($response.body);
    $done({ body: modifiedBody });
}
 
if ($request.url.includes('/api/push/task')) {
    const storedShareId = $prefs.valueForKey(SHAREID_KEY) || 'default_id';
    sendPostRequest(storedShareId);
    $done({});
}