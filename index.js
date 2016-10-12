'use strict'

class UserPoolPlugin {
  constructor(serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = 'aws'
    this.cfAuthorizers = {}

    this.hooks = {
      'before:deploy:deploy': this.beforeDeploy.bind(this),
    }
  }

  beforeDeploy() {
    // Scan all functions and remember the ones with a cfAuthorizer configured.
    this.serverless.service.getAllFunctions().map(functionName => {
      const func = this.serverless.service.getFunction(functionName)
      func.events.map(eventTypes => {
        const http = eventTypes.http
        if (http && http.cfAuthorizer) {
          if (!this.cfAuthorizers[http.path]) {
            this.cfAuthorizers[http.path] = {}
          }
          this.cfAuthorizers[http.path][http.method.toUpperCase()] = http.cfAuthorizer
        }
      })
    })

    // Scan all CloudFormation resources and apply custom authorizers.
    const resources = this.serverless.service.provider.compiledCloudFormationTemplate.Resources
    Object.keys(resources).map(resourceName => {
      const resource = resources[resourceName]
      if (resource.Type === 'AWS::ApiGateway::Method') {
        const method = resource.Properties.HttpMethod.toUpperCase()
        const path = this.getResourcePath(resources[resource.Properties.ResourceId.Ref], resources)
        if (this.cfAuthorizers[path]) {
          const cfAuthorizer = this.cfAuthorizers[path][method]
          if (cfAuthorizer) {
            this.serverless.cli.log('Adding CloudFormation Authorizer ' + cfAuthorizer + ' to ' + method + ' ' + path)
            resource.Properties.AuthorizationType = 'COGNITO_USER_POOLS'
            resource.Properties.AuthorizerId = {Ref:cfAuthorizer}
          }
        }
      }
    })
  }

  // Get the full API Gateway resource path of a relative resource
  getResourcePath(resource, resources) {
    if (resource.Properties.ParentId && resource.Properties.ParentId.Ref) {
      // Add next resource parent
      return this.getResourcePath(resources[resource.Properties.ParentId.Ref], resources) + '/' + resource.Properties.PathPart
    } else {
      // Top level
      return resource.Properties.PathPart
    }
  }
}

module.exports = UserPoolPlugin
