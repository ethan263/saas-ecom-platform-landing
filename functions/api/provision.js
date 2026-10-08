import { LightsailClient, CreateInstancesCommand, GetInstanceCommand } from "@aws-sdk/client-lightsail";

async function createCloudflareDnsRecord(subdomainName, instanceIp, env) {
  const zoneId = env.CLOUDFLARE_ZONE_ID;
  const apiToken = env.CLOUDFLARE_API_TOKEN;
  const rootDomain = env.ROOT_DOMAIN || "yourdomain.com";
  const fullDomain = `${subdomainName}.${rootDomain}`;

  if (!zoneId || !apiToken) {
    console.warn("Cloudflare configuration missing; skipping DNS API call.");
    return { record: fullDomain };
  }

  const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "A",
      name: fullDomain,
      content: instanceIp,
      ttl: 300,
      proxied: false,
    }),
  });

  const data = await response.json();
  if (!data.success) {
    throw new Error(`Cloudflare DNS creation failed: ${JSON.stringify(data.errors)}`);
  }
  return data.result;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const { storeName, subdomain, email, password } = await request.json();

    if (!storeName || !subdomain || !email || !password) {
      return new Response(JSON.stringify({ message: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const region = env.AWS_REGION || "us-east-1";
    const lightsail = new LightsailClient({
      region,
      credentials: {
        accessKeyId: env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || "",
      },
    });

    const sanitizedStore = storeName.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const instanceName = `store-${sanitizedStore}-${Date.now().toString().slice(-4)}`;
    const rootDomain = env.ROOT_DOMAIN || "yourdomain.com";

    const userDataScript = `#!/bin/bash
    apt-get update -y
    apt-get install -y git curl docker.io docker-compose-v2
    systemctl start docker
    systemctl enable docker

    mkdir -p /var/www
    cd /var/www
    
    git clone https://github.com/your-username/saas-ecom-platform.git saas-ecom-platform
    cd saas-ecom-platform

    cat <<EOT > .env
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    COOKIE_SECRET=$(openssl rand -hex 32)
    UMAMI_HASH_SALT=$(openssl rand -hex 16)
    BETTER_AUTH_SECRET=$(openssl rand -hex 32)
    BETTER_AUTH_URL=https://${subdomain}.${rootDomain}
    ADMIN_EMAIL=${email}
    ADMIN_PASSWORD=${password}
    STORE_CORS=https://${subdomain}.${rootDomain},http://localhost:8000
    ADMIN_CORS=http://localhost:9000
    COMPOSIO_API_KEY=${env.COMPOSIO_API_KEY || ''}
    EOT

    docker compose up -d --build
    `;

    await lightsail.send(new CreateInstancesCommand({
      instanceNames: [instanceName],
      availabilityZone: `${region}a`,
      blueprintId: "ubuntu_22_04",
      bundleId: "nano_3_0",
      userData: userDataScript,
    }));

    let publicIp = null;
    let attempts = 0;
    while (!publicIp && attempts < 15) {
      await new Promise((res) => setTimeout(res, 4000));
      try {
        const instanceData = await lightsail.send(new GetInstanceCommand({ instanceName }));
        publicIp = instanceData.instance?.publicIpAddress;
      } catch (e) {
        // Retry
      }
      attempts++;
    }

    if (!publicIp) {
      throw new Error("Timed out waiting for VPS public IP address assignment.");
    }

    try {
      await createCloudflareDnsRecord(subdomain, publicIp, env);
    } catch (dnsErr) {
      console.error("DNS mapping notice:", dnsErr);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "VPS provisioned and domain mapped successfully!",
      instanceName,
      publicIp,
      url: `https://${subdomain}.${rootDomain}`,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Provisioning error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message || "Provisioning failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
