# The repositories
Here is the fork of the front-end. The branch of interest is "bioref" https://github.com/CHUV-DS/glowing-bear-medco-bioref

The fork for the backend is here (the branch name is bioref) https://github.com/CHUV-DS/medco_bioref
	
The functionment of the new explore-statistics module
In the front-end there are few key things to understand. I'll describe the way the logic works in the order in which the code is executed.
First the user communicates with an Angular component to set the parameters of the query:
[explore-statistics settings component](https://github.com/CHUV-DS/glowing-bear-medco-bioref/blob/bioref/src/app/modules/gb-explore-statistics-module/panel-components/gb-explore-statistics-settings/gb-explore-statistics-settings.component.ts)
 

When the user clicks on the run button of this settings component the *explore statistics service* is called via its executeQuery function
[explore-statistics service](https://github.com/CHUV-DS/glowing-bear-medco-bioref/blob/bioref/src/app/services/explore-statistics.service.ts).



When the aggregated result is returned by the servers the value is read by the *results component* using the *Emitter* object from the *explore statistics service*. This emitter is a sort of observable that can stream multiple values throughout time.
[Here is the result component's logic](https://github.com/CHUV-DS/glowing-bear-medco-bioref/blob/bioref/src/app/modules/gb-explore-statistics-module/panel-components/gb-explore-statistics-results/gb-explore-statistics-results.component.ts).

# The API: 
After an explore-statistics request, the front-end receives information from the back-end that describes a histogram.
The histogram contains different intervals (as many as specified by the client via the *number of buckets* parameter).
Each interval is described by its lower and higher bound and the encrypted count of observations that fall within this interval.
The information is structured in the following way:

```Typescript
//This class describes an interval from a histogram. 
export class ApiInterval {
  encCount: string // the encrypted count of observations that fall within this interval
  higherBound: string
  lowerBound: string
}

//describes a histogram received from the backend after an explore-statistics request
export class ApiExploreStatisticsResponse {

  intervals: ApiInterval[]

  unit: string // the unit of the x-axis of the histogram

  timers: {
    name: string
    milliseconds: number
  }[]
}
```

After the front-end client receives this information the counts are all decrypted using the private key of the client.
After this phase, the client is left with the following data:

```Typescript
export class Interval {
    count: number 
    higherBound: string
    lowerBound: string
}

export class ChartInformation {
    intervals: Interval[]
    unit: string
}
```

The `ChartInformation` object may be used at will to build visualisations or statistics.

# Example usages of the functionality

## Weight of people diagnosed with Diabetes:

Imagine one wants to derive statistics on the weight of people diagnosed with Diabetes.

The user would first browse the ontology menu of the MedCo interface in order to find the *Diabetes* medical concept.
Once this is done the user drops this *Diabetes* concept in the set of constraints of the explore functionality. This medical concept will be used to build the cohort of patients that are diagnosed with Diabetes. 
When the cohort is built it can be set as a parameter of the explore-statistics request.
The second parameter that is necessary is the *weight* medical concept. It can once again be retrieved from the ontology.
The third parameter is the number of intervals that will be constructed in the histogram.

After the execution of the query and the counts are decrypted, the following information is returned to the client:
Imagine we specified that we wanted 3 bins in our histogram. Then after decryption the information at the disposal of the client 
follows the following structure:

In this example:
* 10 patients' weight is between 50 and 60 kg
* 42 patients have a weight between 60 and 70 kg
* 20 patients have a weight between 70 and 80 kg
```javascript

  ChartInformation: {
      unit: "kg",

      intervals: [
          { 
              count: 10,
              lowerBound: 50,
              higherBound: 60
          },
          { 
              count: 42,
              lowerBound: 60,
              higherBound: 70
          },
          { 
              count: 20,
              lowerBound: 70,
              higherBound: 80
          }

      ]
  }

```

Any concept's distribution can be visualized as long as the concept is of numerical type. For the moment concepts which are categorical (e.g. the gender of a person) are not supported as the concept which observations' are counted.

On the other hand cohorts (the population of focus) can be constructed upon complex constraints including categorical concepts. In the previous example, the population was composed of patients that are diagnosed with diabetes. One could, thanks to the explore functionality of MedCo, construct a population based on more than one constraint:
For example, it is possible to create constraints that would impose that the cohort is composed of patients that are:
diagnosed with Diabetes AND that are males AND that are taller than 170cm.

One could even use exclusion constraints. One can add any exclusion constraint to a set of inclusion constraints (e.g. patients that are not diagnosed with cancer).


# Creation of a different handler on the backend side:

We created a new handler [explore_statistics.go](https://github.com/CHUV-DS/medco_bioref/blob/bioref/connector/server/handlers/explore_statistics.go). This handler is reachable via the following URL at each MedCo node: /node/explore-statistics/query

This service (ExploreStatisticsHandler) is responsible with answering queries whose aim is to obtain the histogram of the concept sent as parameter to the request. We defined the characteristics of this handler using swagger, and then executed swagger’s code generator in order to obtain the handler’s skeleton.The handler expects the following parameters:
* The ID of the query which will be used to identify the query during the aggregation of thebuckets’ counts.
* The number of buckets (or bins) of the histogram.
* The cohort name of the predefined population of interest.
* The  concept path if only a  concept is  given  as  parameter. If additionally a modifier is given as a parameter, the concept path will be the path of the concept to which the modifier applies.
* The applied path and path of the modifier if some modifier is given as parameter.
* The user public key which will be used for key switching.

The response sent back to the client contains the following information (already partially listed by the API response section):
* A list of buckets. Each list’s element describes the lower and higher bound of a bucket, as well as the encrypted count of observations that fall into that bin.
* Timers detailing how long operations took to execute on the back-end side. 
 
The handler creates a query object using the parameters given by the client. Once this is done the query is executed. This execution steps encompasses the following work (c.f. the Execute() method of the [reference_intervals.go](https://github.com/CHUV-DS/medco_bioref/blob/bioref/connector/server/reference_intervals/reference_intervals.go) file):
* Parsing and preparing the parameters for further work
* Retrieving observations linked to the concept and cohort.
* Construction of the bins boundaries.
* Classifying the observations in the appropriate buckets.
* Aggregating the counts across the different servers.
* Calling the key switching procedure
