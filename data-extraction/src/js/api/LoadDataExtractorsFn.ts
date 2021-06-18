import { DataExtractor } from "./DataExtractorApi";
import type * as helpersTypes from "../helpers"

export type LoadDataExtractorsFn = (
	register: (extractor: DataExtractor) => void,
    helpers: typeof helpersTypes
) => void;
