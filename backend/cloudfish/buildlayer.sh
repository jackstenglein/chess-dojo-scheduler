# Run on cloudshell

sudo yum groupinstall "Development Tools" -y
sudo yum install cmake gcc-c++ -y
git clone https://github.com/official-stockfish/Stockfish.git
cd Stockfish/src
make build ARCH=x86-64
mkdir -p stockfish-layer/bin
cp ./stockfish stockfish-layer/bin/
cd stockfish-layer
zip -r stockfish-layer.zip .
pwd # get the path and download the zip and upload to lambda layer