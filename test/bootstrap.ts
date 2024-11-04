import { FileSystemAdapter } from "../src/filesystem/FileSystemAdapter"
import { NodeJSFSAdapter } from "../src/filesystem/NodeJSFSAdapter"

import { use } from 'chai'
import { chaiString } from './chai/chaiString'
import { chaiAlmost } from "./chai/chaiAlmost"

use(chaiString)
use(chaiAlmost(0.00001))

FileSystemAdapter.setInstance(
    new NodeJSFSAdapter()
)