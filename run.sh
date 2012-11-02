echo "Launch mongod on in new shell (new terminal window)"
      osascript -e 'tell app "Terminal"
        do script "/usr/local/Cellar/mongodb/2.2.0-x86_64/bin/mongod"
      end tell' & node app
