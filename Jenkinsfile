pipeline {
  agent {
    docker {
      image 'node:20'
      args '-u root:root'
    }
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {
    stage('Checkout') {
      steps {
        cleanWs()       // wipe workspace first
        checkout scm    // pull latest code
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
      when {
        expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
      }
      steps {
        dir('simple-nodejs-app-1') {
          sh 'npm test'
        }
      }
    }
  }

  post {
    success {
      echo 'Pipeline succeeded.'
    }
    failure {
      echo 'Pipeline failed. Check lint/test output above.'
    }
    always {
      echo "Build finished with status: ${currentBuild.currentResult}"
    }
  }
}
