pipeline {
  agent {
    docker { image 'node:20' }
  }
  stages {
    stage('Check Docker') {
      steps {
        sh 'node -v'
        sh 'npm -v'
      }
    }
  }
}
