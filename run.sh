echo "Launch mongod on in new shell (new terminal window)"
      osascript -e 'tell app "Terminal"
        do script "mongod"
      end tell' & node app
