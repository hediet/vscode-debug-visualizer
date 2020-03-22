import XCTest

import swiftTests

var tests = [XCTestCaseEntry]()
tests += swiftTests.allTests()
XCTMain(tests)
