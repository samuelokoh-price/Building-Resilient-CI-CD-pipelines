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
        dir('simple-nodejs-app-1') {
          sh 'npm ci'
        }
      }
    }

    stage('Lint') {
      steps {
        dir('simple-nodejs-app-1') {
          sh 'npm run lint'
        }
      }
    }

    stage('Test') {
      steps {
        dir('simple-nodejs-app-1') {
          sh 'npm test'
        }
      }
    }
  }
}
