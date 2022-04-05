# Glowing Bear for TI4Health
*glowing-bear-medco* is the web user interface enabling cohorts exploration and analysis for the TI4Health platform.

This version of Glowing Bear is adapted for Tune Insight's platform TI4health's API.

It is a fork of the version previously developed at EPFL for the [MedCo project](https://medco.epfl.ch/).

## Source code organization
- *deployment*: docker deployment files
- *src*: root of the source code
  - *app*: angular application
    - *config*: configuration of the application
    - *models*: models used in the application
    - *modules*: angular modules
      - *gb-explore-module*: explore query module, enabling the construction of an explore query
      - *gb-explore-results-module*: explore query results module, displaying the results of the explore queries
      - *gb-main-module*: angular main module
      - *gb-navbar-module*: navigation bar module, containing the menu with tabs
      - *gb-side-panel-module*: side panel module, containing the summary, ontology tree and saved cohorts
      - *gb-analysis-module*: analysis module, containing the analysis option (only survival at the current time) and settings for the analysis to run
      - *gb-survival-results-module*: survival results module, containing the results of the various operations run on survival data points in the context of survival analysis. An overview of this compenent's logic can be found in this [file](https://github.com/tuneinsight/glowing-bear-medco/src/survival-analysis.md).
    - *services*: services handling data flow
    - *utilities*: utility tools: crypto, log, error, etc.
  - *assets*: static assets 
  - *environments*: definition of production or test environment
  - *styles*: CSS styles

## Getting started

### Use the live development server
```bash
cd deployment
./dev-server.sh
```

The backend for this version is developed and provided by Tune Insight. If you're interested in contributing please [contact us](contact@tuneinsight.com).


### Build the Docker image
```bash
cd deployment
docker-compose build glowing-bear-medco
```

## License
*glowing-bear-medco* is licensed under the MPL 2.0. If you need more information, please [contact us](contact@tuneinsight.com).