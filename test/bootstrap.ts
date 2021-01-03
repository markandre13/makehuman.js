import { FileSystemAdapter } from "../src/filesystem/FileSystemAdapter"
import { NodeJSFSAdapter } from "../src/filesystem/NodeJSFSAdapter"

FileSystemAdapter.setInstance(
    new NodeJSFSAdapter()
)