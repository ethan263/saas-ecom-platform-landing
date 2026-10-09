import {
  LightsailClient,
  CreateInstancesCommand,
  GetInstanceCommand
} from '@aws-sdk/client-lightsail';

const DEFAULT_CF_TOKEN = process.env.CF_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN;
const DEFAULT_CF_ZONE_ID = '684053e25fbe54308c628c0729ac9d32';
const DEFAULT_ROOT_DOMAIN = 'wwwebby.co.za';

async function syncCloudflareDns(subdomain, publicIp, env) {
  const zoneId = env.CF_ZONE_ID || env.CLOUDFLARE_ZONE_ID || DEFAULT_CF_ZONE_ID;
  const apiToken = env.CF_API_TOKEN || env.CLOUDFLARE_API_TOKEN || DEFAULT_CF_TOKEN;
  const rootDomain = env.ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN;
  const fullDomain = `${subdomain}.${rootDomain}`;

  // 1. Check existing record
  const listUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(
    fullDomain
  )}&type=A`;

  const listRes = await fetch(listUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });

  const listData = await listRes.json();
  const existingRecord = listData?.result?.[0];

  const payload = {
    type: 'A',
    name: fullDomain,
    content: publicIp,
    ttl: 1,
    proxied: false
  };

  if (existingRecord?.id) {
    const updateUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingRecord.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const updateData = await updateRes.json();
    if (!updateData.success) {
      throw new Error(`Cloudflare DNS update failed: ${JSON.stringify(updateData.errors)}`);
    }
  } else {
    const createUrl = `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const createData = await createRes.json();
    if (!createData.success) {
      throw new Error(`Cloudflare DNS create failed: ${JSON.stringify(createData.errors)}`);
    }
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { storeName, subdomain, email, password } = await request.json();

    if (!storeName || !subdomain || !email || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const rootDomain = env.ROOT_DOMAIN || DEFAULT_ROOT_DOMAIN;
    const region = env.AWS_REGION || 'us-east-1';

    const lightsailConfig = { region };
    if (env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY) {
      lightsailConfig.credentials = {
        accessKeyId: env.AWS_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY
      };
    }

    const lightsail = new LightsailClient(lightsailConfig);
    const instanceName = `store-${cleanSubdomain}-${Date.now().toString().slice(-4)}`;
    const cfToken = env.CF_API_TOKEN || env.CLOUDFLARE_API_TOKEN || DEFAULT_CF_TOKEN;
    const cfZone = env.CF_ZONE_ID || env.CLOUDFLARE_ZONE_ID || DEFAULT_CF_ZONE_ID;

    const userDataScript = `#!/bin/bash
set -euxo pipefail

export TENANT_SUBDOMAIN="${cleanSubdomain}"
export TENANT_DOMAIN="${cleanSubdomain}.${rootDomain}"
export ADMIN_EMAIL="${email}"
export ADMIN_PASSWORD="${password}"
export STORE_NAME="${storeName.replace(/"/g, '\\"')}"
export CF_API_TOKEN="${cfToken}"
export CF_ZONE_ID="${cfZone}"

mkdir -p /opt/saas-bootstrap
cd /opt/saas-bootstrap

git clone https://github.com/ethan263/saas-ecom-platform.git /home/ubuntu/saas-ecom-platform || true
cd /home/ubuntu/saas-ecom-platform
chmod +x ./scripts/provision.sh
./scripts/provision.sh > /var/log/wwwebby-provision.log 2>&1
`;

    await lightsail.send(
      new CreateInstancesCommand({
        instanceNames: [instanceName],
        availabilityZone: `${region}a`,
        blueprintId: 'ubuntu_22_04',
        bundleId: 'nano_3_0',
        userData: userDataScript,
        tags: [
          { key: 'tenant', value: cleanSubdomain },
          { key: 'storeName', value: storeName },
          { key: 'platform', value: 'wwwebby' }
        ]
      })
    );

    let publicIp = null;
    let attempts = 0;
    while (!publicIp && attempts < 20) {
      await new Promise((res) => setTimeout(res, 3000));
      try {
        const instanceData = await lightsail.send(new GetInstanceCommand({ instanceName }));
        publicIp = instanceData.instance?.publicIpAddress;
      } catch (e) {
        // Retry
      }
      attempts++;
    }

    if (!publicIp) {
      throw new Error('Timed out waiting for VPS public IP address assignment.');
    }

    await syncCloudflareDns(cleanSubdomain, publicIp, env);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'VPS provisioned and domain mapped successfully!',
        instanceName,
        publicIp,
        url: `https://${cleanSubdomain}.${rootDomain}`
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Provisioning error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Provisioning failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
