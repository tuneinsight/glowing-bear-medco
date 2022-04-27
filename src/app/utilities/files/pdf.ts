import * as jsPDF from 'jspdf'
import 'jspdf-autotable'
import canvg from 'canvg'
import { ErrorHelper } from '../error-helper';
import assert from 'assert';

const ti4HealthBlack = [34, 40, 49]
const exceptionColor = [245, 223, 181]

export class PDF {
  _jsPDF: jsPDF.jsPDF

  private columnsLastElementY: number[]




  constructor(
    public readonly nbOfColumns: number = 1, // specifies the number of columns within one page of the pdf (as in columns of a table)
    public readonly headersSize: number = 14,
    public readonly verticalMarginText: number = -6,
    private verticalMarginTable: number = 7,
    private verticalMarginImage: number = 7,
    private horizontalMargin: number = 14,
    private columnsMargin = 15, // margin between elements of the same row
    private contentSize: number = 8,
    private topMargin: number = 10) {

    this.columnsLastElementY = []
    for (let i = 0; i < nbOfColumns; i++) {
      this.columnsLastElementY.push(this.topMargin) // initializing the space occupied in each column.
    }

    this._jsPDF = new jsPDF.jsPDF()
    this._jsPDF.setFont('Helvetica')
    this._jsPDF.setFontSize(this.headersSize)

    assert(this.spaceOccupiedByPreviousRows(nbOfColumns, true) <= this.getWidth())
  }


  // the width occupied by a column in the pdf page
  getColumnWidth(): number {
    return (this.getWidth() - this.horizontalMargin) / this.nbOfColumns - this.columnsMargin
  }

  getWidth() {
    return this._jsPDF.internal.pageSize.getWidth()
  }

  // add some margin below the latest appended element of the column
  addVerticalMargin(margin: number, columnIndex: number = 0) {
    assert(margin > 0)
    this.columnsLastElementY[columnIndex] += margin
  }


  // space occupied horizontally by previous rows. @param columnIndex: index of the current column
  spaceOccupiedByPreviousRows(columnIndex: number, removeAssertion: boolean = false) {
    if (!removeAssertion) {
      assert(columnIndex < this.nbOfColumns)
    }
    return columnIndex * (this.getColumnWidth() + this.columnsMargin)
  }

  /*
  * This function prints an image @param imData to the pdf at column @columnIndex.
  * The parameters @param x0 and @param x0 specify the position of the image
  * relative to the column. The image is printed after previous elements present in the column specified with @param columnIndex.
  * @param columnIndex defines the columns at which the element will be appended within the current page of the pdf
  */
  addImageFromDataURL(imData: any, x0?: number, y0?: number, width?: number, height?: number, columnIndex: number = 0) {
    assert(columnIndex < this.nbOfColumns)

    const occupiedByPreviousRows = this.spaceOccupiedByPreviousRows(columnIndex)

    const x = occupiedByPreviousRows + x0 + this.horizontalMargin

    // the end of the frame occupied by the position we are going to place
    const yEnd = () => this.columnsLastElementY[columnIndex] + height + this.verticalMarginImage

    this.checkFitInCurrentPage(yEnd());

    const lastElementY = this.columnsLastElementY[columnIndex]
    const y = y0 + lastElementY

    try {
      this._jsPDF.addImage(imData, 'png', x, y, width, height)
    } catch (err) {
      throw ErrorHelper.handleError('during exportation of canvas data to PDF document', err)
    }

    console.log('Exported to PDF.')

    this.columnsLastElementY[columnIndex] = yEnd()
  }


  /* This method verifies if a new element fit in the current page.
  * If the new element position is greater than the page size the code
  * resets the columns height to zero and add a new page to the output pdf.
  * @param yEnd: the bottom vertical position of the new element.
  */
  private checkFitInCurrentPage(yEnd: number) {
    if (yEnd > this._jsPDF.internal.pageSize.getHeight()) {
      // create a new page
      this._jsPDF.addPage();
      // reset the columns height to 0
      for (let i = 0; i < this.columnsLastElementY.length; i++) {
        this.columnsLastElementY[i] = 0;
      }
    }
  }

  addImage(sourceSVGRef: any, targetCanvasRef: any, x0: number, y0: number, x1: number, y1: number) {
    console.log('Parsing SVG')
    let serializer = new XMLSerializer();
    let svgSerialized: string
    try {
      svgSerialized = serializer.serializeToString(sourceSVGRef);
    } catch (err) {
      throw ErrorHelper.handleError('during serialization of SVG data', err)
    }


    // export image from vectorial to raster format
    console.log('SVG parsed. Writing to canvas.')
    try {
      canvg(targetCanvasRef, svgSerialized, { useCORS: true })
    } catch (err) {
      throw ErrorHelper.handleError('during export of SVG data to raster data', err)
    }

    let imData: any
    console.log('Canvas written. Exporting to PNG format.')
    try {
      imData = targetCanvasRef.toDataURL('img/png', 'high')
    } catch (err) {
      throw ErrorHelper.handleError('while parsing canvas ref', err)
    }
    console.log('PNG data written. Exporting to PDF')

    this.addImageFromDataURL(imData, x0, y0, x1, y1)
  }

  addTableFromObjects(headers: string[][], data: string[][], bodyColor = null, columnIndex: number = 0) {
    try {
      (this._jsPDF as any).autoTable({
        head: headers,
        body: data,
        headStyles: {
          fillColor: ti4HealthBlack,
        },
        bodyStyles: {
          fillColor: bodyColor,
        },
        margin: {left: this.horizontalMargin + this.spaceOccupiedByPreviousRows(columnIndex)},
        startY: this.columnsLastElementY[columnIndex],
        tableWidth: this.getColumnWidth(),
      })
    } catch (err) {
      throw ErrorHelper.handleError('while adding table to PDF document', err)
    }
    this.columnsLastElementY[columnIndex] = (this._jsPDF as any).lastAutoTable.finalY + this.verticalMarginTable
  }

  addTableFromHTMLRef(htmlRef: string, bodyColor = null, columnIndex: number = 0) {
    try {
      (this._jsPDF as any).autoTable({
        html: htmlRef,
        startY: this.columnsLastElementY[columnIndex],
        headStyles: {
          fillColor: ti4HealthBlack,
        },
        bodyStyles: {
          fillColor: bodyColor,
        },
      })
    } catch (err) {
      throw ErrorHelper.handleError('while adding table to PDF document from HTML reference', err)
    }
    this.columnsLastElementY[columnIndex] = (this._jsPDF as any).lastAutoTable.finalY + this.verticalMarginTable
  }

  addOneLineText(txt: string, columnIndex: number = 0, fontsize: number = this.headersSize) {
    this._jsPDF.setFontSize(fontsize)
    const x = this.horizontalMargin + this.spaceOccupiedByPreviousRows(columnIndex)

    const yEnd = () => this.columnsLastElementY[columnIndex] + fontsize + this.verticalMarginText
    this.checkFitInCurrentPage(yEnd());

    this._jsPDF.text(txt, x, this.columnsLastElementY[columnIndex])

    this.columnsLastElementY[columnIndex] = yEnd()
  }

  addContentText(txt: string[]) {
    if ((txt) && txt.length !== 0) {
      let body = new Array<string[]>();
      txt.forEach(entry => {
        let newRow = new Array<string>()
        newRow.push(entry)
        body.push(newRow)
      })
      this.addTableFromObjects(null, body, exceptionColor)
    }
  }

  export(fileName: string) {
    try {
      this._jsPDF.save(fileName)
    } catch (err) {
      throw ErrorHelper.handleError('while saving PDF file', err)
    }
  }
}
