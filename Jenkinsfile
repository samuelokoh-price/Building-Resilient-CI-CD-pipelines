pipeline {
  agent {
    docker {
      image 'node:20'
      args '-u root:root' // allows caching and writing files if needed
    }
  }

  options {
    timestamps()
    disableConcurrentBuilds()
  }

  stages {

    stage('Lint') {
      steps {
        sh 'npm run lint'
      }
    }

    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install deps') {
      steps {
        sh 'npm ci'
      }
    }

    // jobs only run if lint passes
    stage('Test') {
      when {
        expression { currentBuild.resultIsBetterOrEqualTo('SUCCESS') }
      }
      steps {
        sh 'npm test'
      }
    }
  }

  post {
    success {
      echo 'Pipeline succeeded.'
    }
    failure {
      echo 'Pipeline failed (likely lint). Investigate ESLint output above.'
    }
    always {
      // Archive logs/artifacts if useful
      echo "Build finished with status: ${currentBuild.currentResult}"
    }
  }
}
