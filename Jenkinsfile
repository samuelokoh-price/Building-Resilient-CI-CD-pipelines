pipeline {
  agent any
  stages {
    stage('Build Docker Image') {
      steps {
        sh 'docker build -t my-node-app .'
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
