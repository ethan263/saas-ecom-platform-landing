import { NextRequest, NextResponse } from 'next/server';
import {
  LightsailClient,
  CreateInstancesCommand,
  GetInstanceCommand
} from '@aws-sdk/client-lightsail';

export const dynamic = 'force-dynamic';

const CLOUDFLARE_API_TOKEN =
  process.env.CF_API_TOKEN ||
  process.env.CLOUDFLARE_API_TOKEN;

const CLOUDFLARE_ZONE_ID =
  process.env.CF_ZONE_ID ||
  process.env.CLOUDFLARE_ZONE_ID ||
  '684053e25fbe54308c628c0729ac9d32';

const ROOT_DOMAIN = process.env.ROOT_DOMAIN || 'wwwebby.co.za';

/**
 * Creates or updates an A record in Cloudflare for <subdomain>.wwwebby.co.za
 */
async function syncCloudflareDns(subdomain: string, publicIp: string): Promise<void> {
  const fullDomain = `${subdomain}.${ROOT_DOMAIN}`;

  // 1. Check if record already exists
  const listUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records?name=${encodeURIComponent(
    fullDomain
  )}&type=A`;

  const listRes = await fetch(listUrl, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  const listData = await listRes.json();
  const existingRecord = listData?.result?.[0];

  const payload = {
    type: 'A',
    name: fullDomain,
    content: publicIp,
    ttl: 1, // Auto TTL
    proxied: false // Direct connection for SSL & services
  };

  if (existingRecord?.id) {
    // Update existing record
    const updateUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${existingRecord.id}`;
    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const updateData = await updateRes.json();
    if (!updateData.success) {
      throw new Error(`Failed to update Cloudflare DNS: ${JSON.stringify(updateData.errors)}`);
    }
  } else {
    // Create new record
    const createUrl = `https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/dns_records`;
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const createData = await createRes.json();
    if (!createData.success) {
      throw new Error(`Failed to create Cloudflare DNS: ${JSON.stringify(createData.errors)}`);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { storeName, subdomain, email, password } = body;

    // 1. Validation
    if (!storeName || typeof storeName !== 'string' || storeName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Store name is required (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Store subdomain is required.' },
        { status: 400 }
      );
    }

    const cleanSubdomain = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (cleanSubdomain.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Subdomain must be at least 3 alphanumeric characters.' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'A valid admin email is required.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Admin password must be at least 6 characters.' },
        { status: 400 }
      );
    }

    // 2. AWS Lightsail Client Initialization
    const region = process.env.AWS_REGION || 'us-east-1';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    const lightsailConfig: any = { region };
    if (accessKeyId && secretAccessKey) {
      lightsailConfig.credentials = {
        accessKeyId,
        secretAccessKey
      };
    }

    const lightsail = new LightsailClient(lightsailConfig);

    const instanceName = `store-${cleanSubdomain}-${Date.now().toString().slice(-4)}`;

    // 3. User Data Script: invokes provision.sh on the target VPS
    const userDataScript = `#!/bin/bash
set -euxo pipefail

export TENANT_SUBDOMAIN="${cleanSubdomain}"
export TENANT_DOMAIN="${cleanSubdomain}.${ROOT_DOMAIN}"
export ADMIN_EMAIL="${email}"
export ADMIN_PASSWORD="${password}"
export STORE_NAME="${storeName.replace(/"/g, '\\"')}"
export CF_API_TOKEN="${CLOUDFLARE_API_TOKEN}"
export CF_ZONE_ID="${CLOUDFLARE_ZONE_ID}"

mkdir -p /opt/saas-bootstrap
cd /opt/saas-bootstrap

# Clone and run provision bootstrap
git clone https://github.com/ethan263/saas-ecom-platform.git /home/ubuntu/saas-ecom-platform || true
cd /home/ubuntu/saas-ecom-platform
chmod +x ./scripts/provision.sh
./scripts/provision.sh > /var/log/wwwebby-provision.log 2>&1
`;

    // 4. Create Lightsail Instance
    const createCommand = new CreateInstancesCommand({
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
    });

    await lightsail.send(createCommand);

    // 5. Poll for Public IP Assignment
    let publicIp: string | null = null;
    const maxAttempts = 20;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      try {
        const getRes = await lightsail.send(new GetInstanceCommand({ instanceName }));
        if (getRes.instance?.publicIpAddress) {
          publicIp = getRes.instance.publicIpAddress;
          break;
        }
      } catch (pollErr) {
        // Retry polling until ready
      }
    }

    if (!publicIp) {
      throw new Error('Timed out waiting for Lightsail instance public IP assignment.');
    }

    // 6. Map Cloudflare DNS A Record
    await syncCloudflareDns(cleanSubdomain, publicIp);

    const tenantUrl = `https://${cleanSubdomain}.${ROOT_DOMAIN}`;

    return NextResponse.json({
      success: true,
      url: tenantUrl,
      publicIp,
      instanceName,
      message: 'VPS instance provisioned and Cloudflare DNS mapped successfully.'
    });
  } catch (err: any) {
    console.error('Provisioning error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'An unexpected error occurred during provisioning.'
      },
      { status: 500 }
    );
  }
}
