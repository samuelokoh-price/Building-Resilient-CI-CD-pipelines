pipeline {
  agent any
  stages {
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t my-node-app -f simple-nodejs-app-1/Dockerfile simple-nodejs-app-1'
      }
    }
    stage('Run Lint') {
      steps {
        sh 'docker run --rm my-node-app npm run lint'
      }
    }
    stage('Run Tests') {
      steps {
        sh 'docker run --rm my-node-app npm test'
      }
    }
  }
}