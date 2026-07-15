import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { EnvConfig } from './env.validation';
import { isApiDocsEnabled } from './configure-app';
import { mergeAuthPaths } from './setup-auth-docs';

export async function setupApiDocs(
  app: INestApplication,
  config: EnvConfig,
): Promise<void> {
  if (!isApiDocsEnabled(config)) {
    return;
  }

  const { apiReference } = await import('@scalar/nestjs-api-reference');

  const {
    PORT: port,
    PRODUCTION_URL: productionUrl,
    DEVELOPMENT_URL: developmentUrl,
    PLATFORM_NAME: platform,
  } = config;

  const swaggerOptions = new DocumentBuilder()
    .setTitle(`${platform} API`)
    .setDescription(`API Documentation for ${platform}.`)
    .setVersion('1.0.0')
    .addServer(`http://localhost:${port}`, 'Local environment')
    .addServer(
      developmentUrl.startsWith('http')
        ? developmentUrl
        : developmentUrl
          ? `https://${developmentUrl}`
          : `http://localhost:${port}`,
      'Development environment',
    )
    .addServer(
      productionUrl.startsWith('http')
        ? productionUrl
        : productionUrl
          ? `https://${productionUrl}`
          : `http://localhost:${port}`,
      'Production environment',
    )
    .addTag('Server', 'Server and health endpoints')
    .addCookieAuth('sessionCookie', {
      type: 'apiKey',
      in: 'cookie',
      name: 'better-auth.session_token',
      description: 'Session cookie set after sign-in',
    })
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description:
          'Session token from sign-in (set-auth-token header) or GET /token when JWT plugin is enabled',
      },
      'bearerAuth',
    )
    .build();

  const baseDocument = SwaggerModule.createDocument(app, swaggerOptions);
  const swaggerDocument = mergeAuthPaths(
    baseDocument as unknown as Parameters<typeof mergeAuthPaths>[0],
  ) as unknown as typeof baseDocument;

  app.use(
    '/v1/api-reference',
    apiReference({
      content: swaggerDocument,
      theme: 'deepSpace',
      hideClientButton: true,
      hideModels: true,
      showSidebar: true,
      showDeveloperTools: 'never',
      operationTitleSource: 'summary',
      persistAuth: false,
      telemetry: false,
      layout: 'modern',
      isEditable: false,
      documentDownloadType: 'both',
      hideTestRequestButton: true,
      hideSearch: false,
      showOperationId: false,
      hideDarkModeToggle: false,
      withDefaultFonts: true,
      defaultOpenAllTags: false,
      expandAllModelSections: false,
      expandAllResponses: false,
      orderSchemaPropertiesBy: 'alpha',
      orderRequiredPropertiesFirst: true,
      _integration: 'nestjs',
      default: false,
      slug: 'api-1',
      title: 'API #1',
    }),
  );

  SwaggerModule.setup('v1/docs', app, swaggerDocument, {
    customSiteTitle: `${platform} API`,
    swaggerOptions: {
      persistAuthorization: true,
      explorer: false,
      defaultModelsExpandDepth: -1,
      docExpansion: 'list',
      defaultModelRendering: 'model',
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      displayRequestDuration: true,
      jsonEditor: false,
      useUnsafeSource: false,
      deepLinking: true,
    },
    customCss: `
      .swagger-ui .topbar { display: none; }
    `,
  });
}
