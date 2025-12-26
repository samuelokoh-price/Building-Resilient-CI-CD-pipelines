pipeline {
  agent {
    docker { image 'node:20' }
  }
  stages {
    stage('Checkout') {
      steps {
        cleanWs()
        checkout scm
      }
    }

    stage('Install deps') {
      steps {
        sh 'cd simple-nodejs-app-1 && npm ci'
        }
      }
    

    stage('Lint') {
      steps {
          sh ' cd simple-nodejs-app-1 && npm run lint'
        }
      }
    

    stage('Test') {
      steps {
        sh 'cd simple-nodejs-app-1 && npm test'
      }
    }
  }
}
