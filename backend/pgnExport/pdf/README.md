The Lambda function in `pdf.ts` generates a PDF of a PGN using [Typst](https://typst.app/docs/). The Lambda function requires that the Typst CLI is installed, along with the [board-n-pieces package](https://typst.app/universe/package/board-n-pieces/).

To accomplish this, we use a [Lambda Layer](https://docs.aws.amazon.com/lambda/latest/dg/chapter-layers.html). The layer adds an installation of the Typst CLI to `/opt/bin/typst` and an installation of the `board-n-pieces` package to `/opt/lib/typst/packages/preview/board-n-pieces/`. For the Lambda OS to detect the Typst CLI, we add `/opt/bin/` to the `PATH` environment variable. In order for Typst to detect the installation of the package, we set the `XDG_DATA_HOME` environment variable to `/opt/lib/`. Environment variables are set in the `serverless.yml` file.

## Creating the Lambda Layer

1. Launch an EC2 instance with the Amazon Linux 2023 OS. You can use the smallest instance type/default settings.
1. SSH into the EC2 instance and run the following commands:

```shell
curl -SL https://github.com/typst/typst/releases/latest/download/typst-x86_64-unknown-linux-musl.tar.xz -o typst.tar.xz
mkdir bin
tar -xJf "typst.tar.xz" -C typst-container
mv typst-container/typst-x86_64-unknown-linux-musl/typst bin/typst

curl -SL https://packages.typst.org/preview/board-n-pieces-0.5.0.tar.gz -o board-n-pieces-0.5.0.tar.gz
mkdir -p lib/typst/packages/preview/board-n-pieces/
tar -xvzf board-n-pieces-0.5.0.tar.gz -C lib/typst/packages/preview/board-n-pieces/0.5.0
zip -r layer.zip bin lib
```

1. Use `scp` to pull the `layer.zip` file from your EC2 instance to your local filesystem. Open layer.zip and verify that it has the following structure:

```
bin/
  typst/
lib/
   typst/
      packages/
         preview/
            board-n-pieces/
               0.5.0/
                  LICENSE
                  README.md
                  assets
                  chess-sym.typ
                  internals.typ
                  lib.typ
                  plugin.wasm
                  typst.toml
                  ...
```

The layer.zip file is your Lambda layer.
