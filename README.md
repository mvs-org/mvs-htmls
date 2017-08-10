# Metaverse Web GUI

Metaverse is a decentralised system based on the blockchain technology,
through which, a network of smart properties , digital identities and value intermediators are established.

# Install dependencies
```bash
npm install
npm install -g grunt
sudo apt-get install ruby-full
gem install sass
grunt build

In case the number of files watched by the user is reached (ENOSPC errors):
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```
