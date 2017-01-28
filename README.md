# nslogin-cli #

[![npm version](https://badge.fury.io/js/nslogin-cli.svg)](https://badge.fury.io/js/nslogin-cli)

nslogin-cli is a free and open source command line tool that allows you to
automatically log into and semi-automatically restore NationStates nations.
This is useful to maintain a large number of puppet nations by preventing them
from ceasing to exist or easily restoring them if they have ceased to exist.

nslogin-cli features the following:

* loading nation names and passwords from a CSV file
* option to automatically log into those nations
* option to semi-automatically (prompting for each nation) restore those nations

## Usage ##

You can install nslogin-cli as a global command line tool using npm: 
`npm -g install nslogin-cli`. This installs the tool with the name `nslogin`.

You can also build nslogin-cli from source using Gulp. There are two main 
targets: `prod` and `dev`. The only difference between them is that `dev` 
includes source maps. There is also a `docs` target to generate documentation.

The following is the output of `nslogin --help`:

```
usage: nslogin [-h] [-v] [--mode MODE] [--encoding ENCODING] [--verbose]
               userAgent path

CLI for logging into and restoring NationStates nations.

Positional arguments:
  userAgent            A string identifying you to the NationStates API.
                       Using the name of your main nation is recommended.
  path                 The path to a CSV file listing nations and their
                       associated passwords in the form 'nation,password',
                       one per line. Each nation in the list will be logged
                       into or restored, depending on the mode.

Optional arguments:
  -h, --help           Show this help message and exit.
  -v, --version        Show program's version number and exit.
  --mode MODE          Whether to log into nations, restore nations, or
                       automatically log into or restore nations depending on
                       whether they exist. The valid options are 'login',
                       'restore', and 'auto'. Defaults to 'auto'.
  --encoding ENCODING  The encoding of the CSV file. Required by the Node.js
                       file system API. Defaults to 'utf8'.
  --verbose            Show detailed error output. This is disabled by
                       default.
```

## License ##

nslogin-cli is licensed under the [Apache License 2.0](http://www.apache.org/licenses/LICENSE-2.0).
