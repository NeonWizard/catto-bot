#! /bin/sh

# install npm and node
curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -
sudo apt -y install nodejs

# install npm packages
npm install

# install systemd service and timer
if [ -f /etc/systemd/system/catto-discordbot.service ]; then
    sudo systemctl disable catto-discordbot.service
    sudo systemctl stop catto-discordbot.service
fi

eval "echo -e \"`<catto-discordbot.service`\"" > /etc/systemd/system/catto-discordbot.service

sudo systemctl daemon-reload
sudo systemctl enable catto-discordbot.service
sudo systemctl start catto-discordbot.service
